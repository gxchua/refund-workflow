import type { Addon, Order, OrderUnit } from '../types/order'
import type { RefundDetails } from '../types/refund'
import { getOrderUnits, hasDeliveryFee } from './orderItems'

// Business rules for what can be refunded. Kept in one place so a rule change from the PM
// only touches this file.

export function isUnitRefundable(unit: OrderUnit): boolean {
  return unit.status === 'paid'
}

/** An add-on can only be refunded together with its unit, so the unit must still be refundable too. */
export function isAddonRefundable(unit: OrderUnit, addon: Addon): boolean {
  return isUnitRefundable(unit) && addon.status === 'paid'
}

/** A paid add-on whose unit is already refunded or pending. It can no longer be refunded on its own. */
export function isAddonLockedByUnit(unit: OrderUnit, addon: Addon): boolean {
  return addon.status === 'paid' && !isUnitRefundable(unit)
}

export function isDeliveryFeeRefundable(order: Order): boolean {
  return hasDeliveryFee(order) && order.delivery_fee_status === 'paid'
}

export function hasRefundableItems(order: Order): boolean {
  return isDeliveryFeeRefundable(order) || getOrderUnits(order).some(({ unit }) => isUnitRefundable(unit))
}

export function isRefundDetailsComplete(details: RefundDetails): boolean {
  if (!details.reason || !details.channel) return false
  return details.reason !== 'other' || details.note.trim().length > 0
}
