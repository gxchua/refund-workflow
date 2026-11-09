import type { Order } from '../types/order'
import type { CreateRefundResponse, RefundDetails, RefundRequest, RefundSelection } from '../types/refund'
import { post } from '../utils/http'
import { fromMinorUnits } from '../utils/money'
import { calculateRefundTotal } from '../utils/refundCalculation'
import { toRequestUnits } from '../utils/refundSelection'

export function buildRefundRequest(
  order: Order,
  selection: RefundSelection,
  details: RefundDetails,
): RefundRequest | null {
  if (!details.reason || !details.channel) return null

  return {
    units: toRequestUnits(selection),
    include_delivery_fee: selection.includeDeliveryFee,
    reason: details.reason,
    reason_note: details.reason === 'other' ? details.note.trim() : null,
    channel: details.channel,
    expected_amount: fromMinorUnits(calculateRefundTotal(order, selection), order.currency),
  }
}

export function createRefund(
  orderId: string,
  request: RefundRequest,
  idempotencyKey: string,
): Promise<CreateRefundResponse> {
  return post<CreateRefundResponse>(`/orders/${encodeURIComponent(orderId)}/refunds`, request, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
