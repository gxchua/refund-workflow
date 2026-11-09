import type { ApiErrorBody } from '../types/api'
import type { ItemStatus, Order } from '../types/order'
import { REFUND_CHANNELS, REFUND_REASONS, type RefundRequest } from '../types/refund'
import { toMinorUnits } from '../utils/money'
import { getOrderUnits } from '../utils/orderItems'
import { calculateRefundTotal } from '../utils/refundCalculation'
import { isAddonRefundable, isDeliveryFeeRefundable, isUnitRefundable } from '../utils/refundRules'
import { fromRequestUnits } from '../utils/refundSelection'

interface RefundRejection {
  status: number
  body: ApiErrorBody
}

function reject(status: number, code: ApiErrorBody['error']['code'], message: string): RefundRejection {
  return { status, body: { error: { code, message } } }
}

/** Server-side checks, in the order a real backend would run them. */
export function validateRefundRequest(order: Order, request: RefundRequest): RefundRejection | null {
  if (request.units.length === 0 && !request.include_delivery_fee) {
    return reject(422, 'VALIDATION_ERROR', 'Select at least one item to refund.')
  }
  if (!REFUND_REASONS.includes(request.reason) || !REFUND_CHANNELS.includes(request.channel)) {
    return reject(422, 'VALIDATION_ERROR', 'Unknown refund reason or channel.')
  }
  if (request.reason === 'other' && !request.reason_note?.trim()) {
    return reject(422, 'VALIDATION_ERROR', 'A note is required when the reason is "other".')
  }

  const units = getOrderUnits(order)
  for (const requested of request.units) {
    const unit = units.find((entry) => entry.unit.unit_id === requested.unit_id)?.unit
    const addonsRefundable = requested.addon_ids.every((addonId) => {
      const addon = unit?.addons.find((item) => item.addon_id === addonId)
      return unit && addon && isAddonRefundable(unit, addon)
    })
    if (!unit || !isUnitRefundable(unit) || !addonsRefundable) {
      return reject(409, 'ITEMS_NOT_REFUNDABLE', 'Some items are no longer refundable.')
    }
  }
  if (request.include_delivery_fee && !isDeliveryFeeRefundable(order)) {
    return reject(409, 'ITEMS_NOT_REFUNDABLE', 'The delivery fee is no longer refundable.')
  }

  const serverTotal = calculateRefundTotal(order, fromRequestUnits(request.units, request.include_delivery_fee))
  if (serverTotal !== toMinorUnits(request.expected_amount, order.currency)) {
    return reject(409, 'AMOUNT_MISMATCH', 'The refund amount has changed. Please review again.')
  }
  return null
}

export function markItemsAs(order: Order, request: Pick<RefundRequest, 'units' | 'include_delivery_fee'>, status: ItemStatus): Order {
  const updated = structuredClone(order)
  for (const { unit } of getOrderUnits(updated)) {
    const requested = request.units.find((item) => item.unit_id === unit.unit_id)
    if (!requested) continue
    unit.status = status
    for (const addon of unit.addons) {
      if (requested.addon_ids.includes(addon.addon_id)) addon.status = status
    }
  }
  if (request.include_delivery_fee) updated.delivery_fee_status = status
  return updated
}
