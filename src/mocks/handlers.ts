import { delay, http, HttpResponse } from 'msw'
import type { ApiErrorBody } from '../types/api'
import type { CreateRefundResponse, RefundRequest } from '../types/refund'
import { readDatabase, writeDatabase } from './mockDatabase'
import { markItemsAs, validateRefundRequest } from './refundProcessing'
import { endOneTimeScenario, getScenario } from './scenario'

const SLOW_RESPONSE_MS = 3_000

function errorResponse(status: number, code: ApiErrorBody['error']['code'], message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status })
}

async function simulateNetworkDelay() {
  await delay(getScenario() === 'slow' ? SLOW_RESPONSE_MS : undefined)
}

export const handlers = [
  http.get<{ orderId: string }>('*/api/orders/:orderId', async ({ params }) => {
    await simulateNetworkDelay()

    if (getScenario() === 'loading_fails') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Something went wrong while loading the order.')
    }

    const order = readDatabase().orders[params.orderId]
    if (!order) return errorResponse(404, 'ORDER_NOT_FOUND', `Order ${params.orderId} was not found.`)
    return HttpResponse.json(order)
  }),

  http.post<{ orderId: string }, RefundRequest>('*/api/orders/:orderId/refunds', async ({ params, request }) => {
    await simulateNetworkDelay()

    const database = readDatabase()
    const order = database.orders[params.orderId]
    if (!order) return errorResponse(404, 'ORDER_NOT_FOUND', `Order ${params.orderId} was not found.`)

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) return errorResponse(422, 'VALIDATION_ERROR', 'Idempotency-Key header is required.')

    const requestBody = await request.text()
    const previous = database.refundsByIdempotencyKey[idempotencyKey]
    if (previous) {
      if (previous.orderId !== order.order_id || previous.requestBody !== requestBody) {
        return errorResponse(422, 'IDEMPOTENCY_KEY_REUSED', 'This key was already used for a different refund.')
      }
      return HttpResponse.json(previous.response, { status: 201 })
    }

    const refundRequest = JSON.parse(requestBody) as RefundRequest
    const scenario = getScenario()

    if (scenario === 'refund_fails') {
      endOneTimeScenario()
      return errorResponse(500, 'INTERNAL_ERROR', 'Something went wrong while creating the refund.')
    }
    if (scenario === 'amount_mismatch') {
      endOneTimeScenario()
      return errorResponse(409, 'AMOUNT_MISMATCH', 'The refund amount has changed. Please review again.')
    }
    if (scenario === 'item_already_refunded') {
      endOneTimeScenario()
      // Someone else refunds the first selected unit (or the fee) just before this request lands.
      const [firstUnit] = refundRequest.units
      database.orders[order.order_id] = markItemsAs(
        order,
        firstUnit
          ? { units: [firstUnit], include_delivery_fee: false }
          : { units: [], include_delivery_fee: refundRequest.include_delivery_fee },
        'refunded',
      )
      writeDatabase(database)
      return errorResponse(409, 'ITEMS_NOT_REFUNDABLE', 'Some items are no longer refundable.')
    }

    const rejection = validateRefundRequest(order, refundRequest)
    if (rejection) return HttpResponse.json(rejection.body, { status: rejection.status })

    database.refundCount += 1
    const updatedOrder = markItemsAs(order, refundRequest, 'refund_pending')
    const response: CreateRefundResponse = {
      refund: {
        refund_id: `RF-${20000 + database.refundCount}`,
        status: 'pending',
        amount: refundRequest.expected_amount,
        currency: order.currency,
        created_at: new Date().toISOString(),
      },
      order: updatedOrder,
    }
    database.orders[order.order_id] = updatedOrder
    database.refundsByIdempotencyKey[idempotencyKey] = { orderId: order.order_id, requestBody, response }
    writeDatabase(database)

    if (scenario === 'refund_times_out') {
      // The refund is saved, but the response never arrives. A retry with the same key gets this result.
      endOneTimeScenario()
      await delay('infinite')
    }
    return HttpResponse.json(response, { status: 201 })
  }),
]
