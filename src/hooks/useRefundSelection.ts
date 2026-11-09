import { useMemo, useState } from 'react'
import type { Order, OrderUnit } from '../types/order'
import type { RefundSelection } from '../types/refund'
import { calculateRefundTotal } from '../utils/refundCalculation'
import {
  EMPTY_SELECTION,
  getSelectAllState,
  isFullRefund,
  isSelectionEmpty,
  keepValidSelection,
  selectAll,
  toggleAddon,
  toggleDeliveryFee,
  toggleUnit,
} from '../utils/refundSelection'

/**
 * The selection is always checked against the latest order, so if the order reloads and
 * some items are no longer refundable, they drop out and the rest stay selected.
 */
export function useRefundSelection(order: Order) {
  const [storedSelection, setStoredSelection] = useState<RefundSelection>(EMPTY_SELECTION)
  const selection = useMemo(() => keepValidSelection(order, storedSelection), [order, storedSelection])

  const update = (change: (current: RefundSelection) => RefundSelection) =>
    setStoredSelection((previous) => change(keepValidSelection(order, previous)))

  const selectAllState = getSelectAllState(order, selection)

  return {
    selection,
    total: calculateRefundTotal(order, selection),
    isEmpty: isSelectionEmpty(selection),
    isFullRefund: isFullRefund(order, selection),
    selectAllState,
    toggleUnit: (unit: OrderUnit) => update((current) => toggleUnit(current, unit)),
    toggleAddon: (unit: OrderUnit, addonId: string) => update((current) => toggleAddon(current, unit, addonId)),
    toggleDeliveryFee: () => update((current) => toggleDeliveryFee(current, order)),
    toggleAll: () => update(() => (selectAllState === true ? EMPTY_SELECTION : selectAll(order))),
  }
}
