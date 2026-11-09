import type { RefundChannel } from '../../types/refund'
import type { HttpError } from '../../utils/http'
import { formatMoney } from '../../utils/money'
import { Alert } from '../ui/Alert'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { CHANNEL_LABELS, getSubmitErrorMessage } from './refundLabels'

interface ConfirmRefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  currency: string
  locale: string
  channel: RefundChannel
  isSubmitting: boolean
  error: HttpError | null
  onConfirm: () => void
}

export function ConfirmRefundDialog({
  open,
  onOpenChange,
  amount,
  currency,
  locale,
  channel,
  isSubmitting,
  error,
  onConfirm,
}: ConfirmRefundDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm refund"
      description={`Refund ${formatMoney(amount, currency, locale)} to the ${CHANNEL_LABELS[channel]}? This can't be undone.`}
      confirmLabel={error ? 'Try again' : 'Confirm refund'}
      busyLabel="Submitting…"
      isBusy={isSubmitting}
      onConfirm={onConfirm}
    >
      {error && !isSubmitting && <Alert tone="error">{getSubmitErrorMessage(error)}</Alert>}
    </ConfirmDialog>
  )
}
