import type { RefundChannel, RefundReason } from '../../types/refund'
import type { HttpError } from '../../utils/http'
import type { Option } from '../ui/options'

export const REASON_OPTIONS: Option<RefundReason>[] = [
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'missing_item', label: 'Missing item' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'late_delivery', label: 'Late delivery' },
  { value: 'other', label: 'Other' },
]

export const CHANNEL_OPTIONS: Option<RefundChannel>[] = [
  {
    value: 'original_payment_method',
    label: 'Original payment method',
    description: 'Back to the card or wallet the customer paid with. May take a few days.',
  },
  { value: 'in_app_credit', label: 'In-app credit', description: "Added to the customer's app balance." },
]

export const CHANNEL_LABELS: Record<RefundChannel, string> = {
  original_payment_method: 'original payment method',
  in_app_credit: 'in-app credit',
}

export function getConflictMessage(error: HttpError): string {
  return error.code === 'AMOUNT_MISMATCH'
    ? 'The refund amount has changed. Please review.'
    : 'This order was updated. Some items are no longer refundable. Please review your selection.'
}

export function getSubmitErrorMessage(error: HttpError): string {
  if (error.kind === 'timeout') {
    return "The server took too long to respond. The refund may have gone through. Try again; it won't be refunded twice."
  }
  if (error.kind === 'network') return "Couldn't reach the server. Check your connection and try again."
  if (error.status === 422) return error.message
  return 'Something went wrong on our side. Please try again.'
}
