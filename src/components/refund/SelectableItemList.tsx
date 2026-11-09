import { useId } from 'react'
import type { Order, OrderUnit } from '../../types/order'
import type { RefundSelection } from '../../types/refund'
import { toMinorUnits } from '../../utils/money'
import { getOrderUnits, hasDeliveryFee } from '../../utils/orderItems'
import {
  hasRefundableItems,
  isAddonLockedByUnit,
  isAddonRefundable,
  isDeliveryFeeRefundable,
  isUnitRefundable,
} from '../../utils/refundRules'
import { isAddonSelected, isUnitSelected, type SelectAllState } from '../../utils/refundSelection'
import { ItemRow } from '../order/ItemRow'
import { getUnitPositionLabel } from '../order/orderLabels'
import { StatusBadge } from '../order/StatusBadge'
import { Checkbox } from '../ui/Checkbox'
import { Money } from '../ui/Money'

interface SelectableItemListProps {
  order: Order
  locale: string
  selection: RefundSelection
  selectAllState: SelectAllState
  onToggleAll: () => void
  onToggleUnit: (unit: OrderUnit) => void
  onToggleAddon: (unit: OrderUnit, addonId: string) => void
  onToggleDeliveryFee: () => void
}

export function SelectableItemList({
  order,
  locale,
  selection,
  selectAllState,
  onToggleAll,
  onToggleUnit,
  onToggleAddon,
  onToggleDeliveryFee,
}: SelectableItemListProps) {
  const idPrefix = useId()
  const canSelectAny = hasRefundableItems(order)
  const price = (amount: number) => (
    <Money amount={toMinorUnits(amount, order.currency)} currency={order.currency} locale={locale} />
  )

  return (
    <div className="space-y-2">
      <div className="border-b border-slate-200 pb-2">
        <ItemRow
          name="Select all"
          price={null}
          isDisabled={!canSelectAny}
          controlId={`${idPrefix}-all`}
          control={
            <Checkbox
              id={`${idPrefix}-all`}
              checked={selectAllState}
              disabled={!canSelectAny}
              onCheckedChange={onToggleAll}
            />
          }
        />
      </div>

      <ul className="divide-y divide-slate-200">
        {getOrderUnits(order).map(({ line, unit, position, lineQuantity }) => {
          const unitId = `${idPrefix}-${unit.unit_id}`
          const unitSelected = isUnitSelected(selection, unit.unit_id)
          const unitDisabled = !isUnitRefundable(unit)

          return (
            <li key={unit.unit_id} className="py-1">
              <ItemRow
                name={line.name}
                detail={getUnitPositionLabel(position, lineQuantity)}
                price={price(line.unit_price)}
                meta={unitDisabled && <StatusBadge status={unit.status} />}
                isDisabled={unitDisabled}
                controlId={unitId}
                control={
                  <Checkbox
                    id={unitId}
                    checked={unitSelected}
                    disabled={unitDisabled}
                    onCheckedChange={() => onToggleUnit(unit)}
                  />
                }
              />
              {unit.addons.length > 0 && (
                <ul>
                  {unit.addons.map((addon) => {
                    const addonId = `${unitId}-${addon.addon_id}`
                    const addonDisabled = !isAddonRefundable(unit, addon) || !unitSelected
                    const lockedReason = isAddonLockedByUnit(unit, addon)
                      ? unit.status === 'refunded'
                        ? 'Drink already refunded'
                        : 'Drink refund pending'
                      : null

                    return (
                      <li key={addon.addon_id}>
                        <ItemRow
                          isAddon
                          name={addon.name}
                          price={price(addon.unit_price)}
                          meta={addon.status !== 'paid' ? <StatusBadge status={addon.status} /> : lockedReason}
                          isDisabled={addonDisabled}
                          controlId={addonId}
                          control={
                            <Checkbox
                              id={addonId}
                              checked={isAddonSelected(selection, unit.unit_id, addon.addon_id)}
                              disabled={addonDisabled}
                              onCheckedChange={() => onToggleAddon(unit, addon.addon_id)}
                            />
                          }
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}

        {hasDeliveryFee(order) && (
          <li className="py-1">
            <ItemRow
              name="Delivery fee"
              price={price(order.delivery_fee)}
              meta={!isDeliveryFeeRefundable(order) && <StatusBadge status={order.delivery_fee_status} />}
              isDisabled={!isDeliveryFeeRefundable(order)}
              controlId={`${idPrefix}-delivery-fee`}
              control={
                <Checkbox
                  id={`${idPrefix}-delivery-fee`}
                  checked={selection.includeDeliveryFee}
                  disabled={!isDeliveryFeeRefundable(order)}
                  onCheckedChange={onToggleDeliveryFee}
                />
              }
            />
          </li>
        )}
      </ul>
    </div>
  )
}
