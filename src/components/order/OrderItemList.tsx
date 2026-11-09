import type { Order } from '../../types/order'
import { toMinorUnits } from '../../utils/money'
import { getOrderUnits, hasDeliveryFee } from '../../utils/orderItems'
import { Money } from '../ui/Money'
import { ItemRow } from './ItemRow'
import { getUnitPositionLabel } from './orderLabels'
import { StatusBadge } from './StatusBadge'

/** The order's items as shown on the order page: one row per unit, add-ons nested, each with its status. */
export function OrderItemList({ order, locale }: { order: Order; locale: string }) {
  const price = (amount: number) => (
    <Money amount={toMinorUnits(amount, order.currency)} currency={order.currency} locale={locale} />
  )

  return (
    <ul className="divide-y divide-slate-200">
      {getOrderUnits(order).map(({ line, unit, position, lineQuantity }) => (
        <li key={unit.unit_id} className="py-1">
          <ItemRow
            name={line.name}
            detail={getUnitPositionLabel(position, lineQuantity)}
            price={price(line.unit_price)}
            meta={<StatusBadge status={unit.status} />}
          />
          {unit.addons.length > 0 && (
            <ul>
              {unit.addons.map((addon) => (
                <li key={addon.addon_id}>
                  <ItemRow
                    isAddon
                    name={addon.name}
                    price={price(addon.unit_price)}
                    meta={<StatusBadge status={addon.status} />}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}

      {hasDeliveryFee(order) && (
        <li className="py-1">
          <ItemRow
            name="Delivery fee"
            price={price(order.delivery_fee)}
            meta={<StatusBadge status={order.delivery_fee_status} />}
          />
        </li>
      )}
    </ul>
  )
}
