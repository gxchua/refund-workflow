import { useState } from 'react'
import { useOrder } from '../../hooks/useOrder'
import { useRefundSelection } from '../../hooks/useRefundSelection'
import { useRefundSubmission } from '../../hooks/useRefundSubmission'
import { buildRefundRequest } from '../../services/refundService'
import type { Order } from '../../types/order'
import type { CreateRefundResponse, RefundChannel, RefundDetails } from '../../types/refund'
import type { HttpError } from '../../utils/http'
import { getLocale } from '../../utils/locale'
import { isRefundDetailsComplete } from '../../utils/refundRules'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { SkeletonRows } from '../ui/Skeleton'
import { ConfirmRefundDialog } from './ConfirmRefundDialog'
import { getConflictMessage } from './refundLabels'
import { ReviewStep } from './ReviewStep'
import { SelectItemsStep } from './SelectItemsStep'

const EMPTY_DETAILS: RefundDetails = { reason: null, note: '', channel: null }
const LOADING_ROWS = 6

type OnRefunded = (response: CreateRefundResponse, channel: RefundChannel) => void

interface RefundModalProps {
  /** The order to refund. The modal is open while this is set. */
  orderId: string | null
  onClose: () => void
  onRefunded: OnRefunded
}

export function RefundModal({ orderId, onClose, onRefunded }: RefundModalProps) {
  return (
    <Modal
      open={orderId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={orderId ? `Refund order ${orderId}` : 'Refund order'}
    >
      {orderId && <RefundOrderLoader orderId={orderId} onCancel={onClose} onRefunded={onRefunded} />}
    </Modal>
  )
}

/** Fetches the full order each time the modal opens, so staff always start from the latest data. */
function RefundOrderLoader({ orderId, onCancel, onRefunded }: { orderId: string; onCancel: () => void; onRefunded: OnRefunded }) {
  const { order, isLoading, error, reload } = useOrder(orderId)

  if (!order) {
    return (
      <>
        <ModalBody>
          {error && !isLoading ? (
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
          ) : (
            <SkeletonRows rows={LOADING_ROWS} label="Loading order" />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </ModalFooter>
      </>
    )
  }

  return (
    <RefundFlow
      order={order}
      locale={getLocale(order.country)}
      reloadError={error}
      isReloading={isLoading}
      onCancel={onCancel}
      onRefunded={onRefunded}
      onReload={reload}
    />
  )
}

interface RefundFlowProps {
  order: Order
  locale: string
  /** Set when reloading the order failed, e.g. after a 409. `order` is then out of date. */
  reloadError: HttpError | null
  isReloading: boolean
  onCancel: () => void
  onRefunded: OnRefunded
  /** Reloads the order, e.g. after the server says it changed. */
  onReload: () => Promise<unknown>
}

/** Lives inside the modal, so closing the modal discards the selection and details. */
function RefundFlow({ order, locale, reloadError, isReloading, onCancel, onRefunded, onReload }: RefundFlowProps) {
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [details, setDetails] = useState<RefundDetails>(EMPTY_DETAILS)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refund = useRefundSelection(order)
  const submission = useRefundSubmission(order.order_id)
  const request = buildRefundRequest(order, refund.selection, details)

  async function handleConfirm() {
    if (!request) return
    const result = await submission.submit(request)
    if (result.ok) {
      onRefunded(result.response, request.channel)
      return
    }
    if (result.error.status === 409) {
      setIsRefreshing(true)
      await onReload()
      setIsRefreshing(false)
      setIsConfirmOpen(false)
      submission.clearError()
      setConflictMessage(getConflictMessage(result.error))
      setStep('select')
    }
  }

  function handleConfirmOpenChange(open: boolean) {
    setIsConfirmOpen(open)
    if (!open) submission.clearError()
  }

  return (
    <>
      {step === 'select' ? (
        <SelectItemsStep
          order={order}
          locale={locale}
          selection={refund.selection}
          selectAllState={refund.selectAllState}
          total={refund.total}
          isSelectionEmpty={refund.isEmpty}
          conflictMessage={conflictMessage}
          reloadError={reloadError}
          isReloading={isReloading}
          onReload={() => void onReload()}
          onToggleAll={refund.toggleAll}
          onToggleUnit={refund.toggleUnit}
          onToggleAddon={refund.toggleAddon}
          onToggleDeliveryFee={refund.toggleDeliveryFee}
          onCancel={onCancel}
          onNext={() => {
            setConflictMessage(null)
            setStep('review')
          }}
        />
      ) : (
        <ReviewStep
          order={order}
          locale={locale}
          selection={refund.selection}
          total={refund.total}
          isFullRefund={refund.isFullRefund}
          details={details}
          onChange={setDetails}
          canConfirm={!refund.isEmpty && isRefundDetailsComplete(details)}
          onBack={() => setStep('select')}
          onConfirm={() => setIsConfirmOpen(true)}
        />
      )}

      {request && (
        <ConfirmRefundDialog
          open={isConfirmOpen}
          onOpenChange={handleConfirmOpenChange}
          amount={refund.total}
          currency={order.currency}
          locale={locale}
          channel={request.channel}
          isSubmitting={submission.isSubmitting || isRefreshing}
          error={submission.error}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
