import type { Order } from './order'

export const REFUND_REASONS = ['wrong_item', 'missing_item', 'quality_issue', 'late_delivery', 'other'] as const
export type RefundReason = (typeof REFUND_REASONS)[number]

export const REFUND_CHANNELS = ['original_payment_method', 'in_app_credit'] as const
export type RefundChannel = (typeof REFUND_CHANNELS)[number]

/** What staff have ticked: each selected unit maps to the add-on IDs ticked under it. */
export interface RefundSelection {
  units: Record<string, string[]>
  includeDeliveryFee: boolean
}

export interface RefundDetails {
  reason: RefundReason | null
  note: string
  channel: RefundChannel | null
}

export interface RefundRequestUnit {
  unit_id: string
  addon_ids: string[]
}

export interface RefundRequest {
  units: RefundRequestUnit[]
  include_delivery_fee: boolean
  reason: RefundReason
  reason_note: string | null
  channel: RefundChannel
  expected_amount: number
}

export interface Refund {
  refund_id: string
  status: 'pending'
  amount: number
  currency: string
  created_at: string
}

export interface CreateRefundResponse {
  refund: Refund
  order: Order
}
