import type { Order } from '../types/order'
import type { RefundSelection } from '../types/refund'
import { toMinorUnits } from './money'
import { getOrderUnits } from './orderItems'
import { isAddonRefundable, isDeliveryFeeRefundable, isUnitRefundable } from './refundRules'

/**
 * Refund total in the currency's smallest unit (e.g. 2880 for RM 28.80).
 * Each selected unit adds the line's unit price plus the add-ons ticked under it.
 * Items that are not refundable are never counted, even if they appear in the selection.
 */
export function calculateRefundTotal(order: Order, selection: RefundSelection): number {
  let total = 0

  for (const { line, unit } of getOrderUnits(order)) {
    const selectedAddonIds = selection.units[unit.unit_id]
    if (!selectedAddonIds || !isUnitRefundable(unit)) continue

    total += toMinorUnits(line.unit_price, order.currency)
    for (const addon of unit.addons) {
      if (selectedAddonIds.includes(addon.addon_id) && isAddonRefundable(unit, addon)) {
        total += toMinorUnits(addon.unit_price, order.currency)
      }
    }
  }

  if (selection.includeDeliveryFee && isDeliveryFeeRefundable(order)) {
    total += toMinorUnits(order.delivery_fee, order.currency)
  }

  return total
}
