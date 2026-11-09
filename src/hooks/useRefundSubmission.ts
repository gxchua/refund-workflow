import { useRef, useState } from 'react'
import { createRefund } from '../services/refundService'
import type { CreateRefundResponse, RefundRequest } from '../types/refund'
import { type HttpError, toHttpError } from '../utils/http'

type SubmissionResult = { ok: true; response: CreateRefundResponse } | { ok: false; error: HttpError }

interface RefundAttempt {
  requestBody: string
  idempotencyKey: string
}

export function useRefundSubmission(orderId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<HttpError | null>(null)
  const attemptRef = useRef<RefundAttempt | null>(null)

  async function submit(request: RefundRequest): Promise<SubmissionResult> {
    // One idempotency key per refund attempt. Retrying the same refund reuses the key, so the
    // server can't refund twice after a timeout. Any change to the refund gets a new key.
    const requestBody = JSON.stringify(request)
    if (attemptRef.current?.requestBody !== requestBody) {
      attemptRef.current = { requestBody, idempotencyKey: crypto.randomUUID() }
    }
    const { idempotencyKey } = attemptRef.current

    setIsSubmitting(true)
    setError(null)
    try {
      return { ok: true, response: await createRefund(orderId, request, idempotencyKey) }
    } catch (caught) {
      const httpError = toHttpError(caught)
      // A 409 means the order changed. Submitting again is a new refund, so it gets a new key.
      if (httpError.status === 409) attemptRef.current = null
      setError(httpError)
      return { ok: false, error: httpError }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, isSubmitting, error, clearError: () => setError(null) }
}
