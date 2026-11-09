import type { Order, OrderUnit } from '../types/order'
import type { RefundRequestUnit, RefundSelection } from '../types/refund'
import { getOrderUnits } from './orderItems'
import { isAddonRefundable, isDeliveryFeeRefundable, isUnitRefundable } from './refundRules'

export const EMPTY_SELECTION: RefundSelection = { units: {}, includeDeliveryFee: false }

export type SelectAllState = boolean | 'indeterminate'

export function isUnitSelected(selection: RefundSelection, unitId: string): boolean {
  return unitId in selection.units
}

export function isAddonSelected(selection: RefundSelection, unitId: string, addonId: string): boolean {
  return selection.units[unitId]?.includes(addonId) ?? false
}

export function isSelectionEmpty(selection: RefundSelection): boolean {
  return Object.keys(selection.units).length === 0 && !selection.includeDeliveryFee
}

function getRefundableAddonIds(unit: OrderUnit): string[] {
  return unit.addons.filter((addon) => isAddonRefundable(unit, addon)).map((addon) => addon.addon_id)
}

/** Ticking a unit also ticks its refundable add-ons. Unticking it removes them. */
export function toggleUnit(selection: RefundSelection, unit: OrderUnit): RefundSelection {
  if (!isUnitRefundable(unit)) return selection

  const units = { ...selection.units }
  if (isUnitSelected(selection, unit.unit_id)) {
    delete units[unit.unit_id]
  } else {
    units[unit.unit_id] = getRefundableAddonIds(unit)
  }
  return { ...selection, units }
}

/** Add-ons can only be changed while their unit is ticked. */
export function toggleAddon(selection: RefundSelection, unit: OrderUnit, addonId: string): RefundSelection {
  const selectedAddonIds = selection.units[unit.unit_id]
  const addon = unit.addons.find((item) => item.addon_id === addonId)
  if (!selectedAddonIds || !addon || !isAddonRefundable(unit, addon)) return selection

  const nextAddonIds = selectedAddonIds.includes(addonId)
    ? selectedAddonIds.filter((id) => id !== addonId)
    : [...selectedAddonIds, addonId]
  return { ...selection, units: { ...selection.units, [unit.unit_id]: nextAddonIds } }
}

export function toggleDeliveryFee(selection: RefundSelection, order: Order): RefundSelection {
  if (!isDeliveryFeeRefundable(order)) return selection
  return { ...selection, includeDeliveryFee: !selection.includeDeliveryFee }
}

export function selectAll(order: Order): RefundSelection {
  const units: RefundSelection['units'] = {}
  for (const { unit } of getOrderUnits(order)) {
    if (isUnitRefundable(unit)) units[unit.unit_id] = getRefundableAddonIds(unit)
  }
  return { units, includeDeliveryFee: isDeliveryFeeRefundable(order) }
}

function countSelectedItems(selection: RefundSelection, includeDeliveryFee: boolean): number {
  const unitsAndAddons = Object.values(selection.units).reduce((count, addonIds) => count + 1 + addonIds.length, 0)
  return unitsAndAddons + (includeDeliveryFee && selection.includeDeliveryFee ? 1 : 0)
}

export function getSelectAllState(order: Order, selection: RefundSelection): SelectAllState {
  const selected = countSelectedItems(selection, true)
  if (selected === 0) return false
  return selected === countSelectedItems(selectAll(order), true) ? true : 'indeterminate'
}

/**
 * Full refund = every refundable unit and add-on is selected. The delivery fee is optional,
 * so it doesn't count towards this.
 */
export function isFullRefund(order: Order, selection: RefundSelection): boolean {
  const refundableItems = countSelectedItems(selectAll(order), false)
  return refundableItems > 0 && countSelectedItems(selection, false) === refundableItems
}

/**
 * Drops anything that is no longer refundable, e.g. after the order was reloaded because
 * someone else refunded part of it. Everything still valid stays selected.
 */
export function keepValidSelection(order: Order, selection: RefundSelection): RefundSelection {
  const units: RefundSelection['units'] = {}
  for (const { unit } of getOrderUnits(order)) {
    const selectedAddonIds = selection.units[unit.unit_id]
    if (!selectedAddonIds || !isUnitRefundable(unit)) continue
    units[unit.unit_id] = selectedAddonIds.filter((addonId) => getRefundableAddonIds(unit).includes(addonId))
  }
  return { units, includeDeliveryFee: selection.includeDeliveryFee && isDeliveryFeeRefundable(order) }
}

export function toRequestUnits(selection: RefundSelection): RefundRequestUnit[] {
  return Object.entries(selection.units).map(([unitId, addonIds]) => ({ unit_id: unitId, addon_ids: addonIds }))
}

export function fromRequestUnits(units: RefundRequestUnit[], includeDeliveryFee: boolean): RefundSelection {
  return {
    units: Object.fromEntries(units.map((unit) => [unit.unit_id, unit.addon_ids])),
    includeDeliveryFee,
  }
}
