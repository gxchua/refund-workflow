import { useId, useState } from 'react'
import { useOrder } from '../../hooks/useOrder'
import type { Order } from '../../types/order'
import type { CreateRefundResponse, RefundChannel } from '../../types/refund'
import { formatDateTime, getCountryName, getLocale } from '../../utils/locale'
import { formatMoney, toMinorUnits } from '../../utils/money'
import { hasRefundableItems } from '../../utils/refundRules'
import { CHANNEL_LABELS } from '../refund/refundLabels'
import { RefundModal } from '../refund/RefundModal'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SkeletonRows } from '../ui/Skeleton'
import { OrderItemList } from './OrderItemList'
import { ORDER_STATUS_LABELS } from './orderLabels'

const LOADING_ROWS = 6

interface SubmittedRefund {
  response: CreateRefundResponse
  channel: RefundChannel
}

export function OrderPage({ orderId }: { orderId: string }) {
  const { order, error, reload, setData } = useOrder(orderId)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [submittedRefund, setSubmittedRefund] = useState<SubmittedRefund | null>(null)

  function handleRefunded(response: CreateRefundResponse, channel: RefundChannel) {
    setIsRefundOpen(false)
    setSubmittedRefund({ response, channel })
    // The response carries the updated order, so the page refreshes without another request.
    setData(response.order)
  }

  function handleRefundClose() {
    setIsRefundOpen(false)
    // The modal loads its own copy of the order and may have seen a newer one, e.g. after a 409.
    void reload()
  }

  return (
    // Bottom padding keeps the last row clear of the fixed demo panel.
    <main className="mx-auto max-w-4xl space-y-6 px-4 pt-8 pb-24 sm:px-6">
      {submittedRefund && (
        <RefundSubmittedBanner {...submittedRefund} onDismiss={() => setSubmittedRefund(null)} />
      )}

      {error && (
        <Alert
          tone="error"
          title="Couldn't load the order"
          action={
            <Button variant="secondary" onClick={() => void reload()}>
              Retry
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      {order ? (
        <OrderDetails order={order} onRefund={() => setIsRefundOpen(true)} />
      ) : (
        !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <SkeletonRows rows={LOADING_ROWS} label="Loading order" />
          </div>
        )
      )}

      <RefundModal orderId={isRefundOpen ? orderId : null} onClose={handleRefundClose} onRefunded={handleRefunded} />
    </main>
  )
}

function OrderDetails({ order, onRefund }: { order: Order; onRefund: () => void }) {
  const locale = getLocale(order.country)
  const canRefund = hasRefundableItems(order)
  const reasonId = useId()

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">Order {order.order_id}</h1>
            <Badge tone="success">{ORDER_STATUS_LABELS[order.status]}</Badge>
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-slate-600">Store</dt>
              <dd className="font-medium">
                {order.store_id}, {getCountryName(order.country, locale)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-600">Placed</dt>
              <dd className="font-medium">{formatDateTime(order.placed_at, locale)}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={onRefund} disabled={!canRefund} aria-describedby={canRefund ? undefined : reasonId}>
            Refund
          </Button>
          {!canRefund && (
            <p id={reasonId} className="text-sm text-slate-600">
              Nothing left to refund
            </p>
          )}
        </div>
      </header>

      <section aria-labelledby={`${reasonId}-items`} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <h2 id={`${reasonId}-items`} className="px-2 pb-2 font-semibold">
          Items
        </h2>
        <OrderItemList order={order} locale={locale} />
      </section>
    </>
  )
}

function RefundSubmittedBanner({ response, channel, onDismiss }: SubmittedRefund & { onDismiss: () => void }) {
  const { refund, order } = response
  const amount = formatMoney(toMinorUnits(refund.amount, refund.currency), refund.currency, getLocale(order.country))

  return (
    <Alert tone="success" title="Refund submitted" onDismiss={onDismiss}>
      {amount} to {CHANNEL_LABELS[channel]}. Reference {refund.refund_id}.
    </Alert>
  )
}
