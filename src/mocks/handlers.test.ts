import { getResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RefundRequest } from '../types/refund'
import { handlers } from './handlers'
import { readDatabase, resetDatabase, writeDatabase } from './mockDatabase'
import { markItemsAs } from './refundProcessing'

const ORDER_ID = 'ORD-10482'

const request: RefundRequest = {
  units: [
    { unit_id: 'L1-2', addon_ids: ['A1'] },
    { unit_id: 'L3-1', addon_ids: [] },
  ],
  include_delivery_fee: true,
  reason: 'wrong_item',
  reason_note: null,
  channel: 'original_payment_method',
  expected_amount: 28.8,
}

function postRefund(body: RefundRequest) {
  return getResponse(
    handlers,
    new Request(`http://localhost/api/orders/${ORDER_ID}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(body),
    }),
  )
}

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  })
  resetDatabase()
})

describe('POST /orders/:orderId/refunds', () => {
  it('rejects the whole request when one selected item is already pending, and changes nothing', async () => {
    const database = readDatabase()
    database.orders[ORDER_ID] = markItemsAs(
      database.orders[ORDER_ID],
      { units: [{ unit_id: 'L3-1', addon_ids: [] }], include_delivery_fee: false },
      'refund_pending',
    )
    writeDatabase(database)
    const before = readDatabase()

    const response = await postRefund(request)

    expect(response?.status).toBe(409)
    expect(await response?.json()).toMatchObject({ error: { code: 'ITEMS_NOT_REFUNDABLE' } })
    expect(readDatabase()).toEqual(before)
  })

  it('marks the selected items as pending when everything is still refundable', async () => {
    const response = await postRefund(request)

    expect(response?.status).toBe(201)
    expect(readDatabase().orders[ORDER_ID].delivery_fee_status).toBe('refund_pending')
  })
})
