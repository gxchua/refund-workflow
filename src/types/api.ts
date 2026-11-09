export type ApiErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ITEMS_NOT_REFUNDABLE'
  | 'AMOUNT_MISMATCH'
  | 'VALIDATION_ERROR'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
  }
}
