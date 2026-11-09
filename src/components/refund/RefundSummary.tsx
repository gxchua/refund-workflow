import type { Order } from '../../types/order'
import type { RefundSelection } from '../../types/refund'
import { toMinorUnits } from '../../utils/money'
import { getOrderUnits } from '../../utils/orderItems'
import { isAddonSelected, isUnitSelected } from '../../utils/refundSelection'
import { ItemRow } from '../order/ItemRow'
import { getUnitPositionLabel } from '../order/orderLabels'
import { Badge } from '../ui/Badge'
import { Money } from '../ui/Money'

interface RefundSummaryProps {
  order: Order
  locale: string
  selection: RefundSelection
  total: number
  isFullRefund: boolean
}

export function RefundSummary({ order, locale, selection, total, isFullRefund }: RefundSummaryProps) {
  const price = (amount: number) => (
    <Money amount={toMinorUnits(amount, order.currency)} currency={order.currency} locale={locale} />
  )
  const selectedUnits = getOrderUnits(order).filter(({ unit }) => isUnitSelected(selection, unit.unit_id))

  return (
    <section aria-labelledby="refund-summary-heading" className="rounded-md border border-slate-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <h3 id="refund-summary-heading" className="font-semibold">
          What will be refunded
        </h3>
        {isFullRefund && <Badge tone="info">Full refund</Badge>}
      </div>
      <ul className="divide-y divide-slate-200 px-2">
        {selectedUnits.map(({ line, unit, position, lineQuantity }) => (
          <li key={unit.unit_id} className="py-1">
            <ItemRow
              name={line.name}
              detail={getUnitPositionLabel(position, lineQuantity)}
              price={price(line.unit_price)}
            />
            {unit.addons
              .filter((addon) => isAddonSelected(selection, unit.unit_id, addon.addon_id))
              .map((addon) => (
                <ItemRow key={addon.addon_id} isAddon name={addon.name} price={price(addon.unit_price)} />
              ))}
          </li>
        ))}
        {selection.includeDeliveryFee && (
          <li className="py-1">
            <ItemRow name="Delivery fee" price={price(order.delivery_fee)} />
          </li>
        )}
      </ul>
      <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 px-4 py-3 font-semibold">
        <span>Total</span>
        <Money amount={total} currency={order.currency} locale={locale} />
      </div>
    </section>
  )
}
