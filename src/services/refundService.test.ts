import { describe, expect, it } from 'vitest'
import { SAMPLE_ORDER } from '../mocks/seedOrders'
import type { RefundDetails, RefundSelection } from '../types/refund'
import { buildRefundRequest } from './refundService'

const selection: RefundSelection = { units: { 'L1-2': ['A1'], 'L3-1': [] }, includeDeliveryFee: true }
const details: RefundDetails = { reason: 'wrong_item', note: '', channel: 'original_payment_method' }

describe('buildRefundRequest', () => {
  it('sends the selection and the total staff saw, as a decimal amount', () => {
    expect(buildRefundRequest(SAMPLE_ORDER, selection, details)).toEqual({
      units: [
        { unit_id: 'L1-2', addon_ids: ['A1'] },
        { unit_id: 'L3-1', addon_ids: [] },
      ],
      include_delivery_fee: true,
      reason: 'wrong_item',
      reason_note: null,
      channel: 'original_payment_method',
      expected_amount: 28.8,
    })
  })

  it('returns null until a reason and a channel are chosen', () => {
    expect(buildRefundRequest(SAMPLE_ORDER, selection, { ...details, reason: null })).toBeNull()
    expect(buildRefundRequest(SAMPLE_ORDER, selection, { ...details, channel: null })).toBeNull()
  })

  it('sends the trimmed note only when the reason is "other"', () => {
    const other = buildRefundRequest(SAMPLE_ORDER, selection, { ...details, reason: 'other', note: '  Cup was leaking ' })
    expect(other?.reason_note).toBe('Cup was leaking')
    expect(buildRefundRequest(SAMPLE_ORDER, selection, { ...details, note: 'left over' })?.reason_note).toBeNull()
  })
})
