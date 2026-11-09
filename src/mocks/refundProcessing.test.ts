import { describe, expect, it } from 'vitest'
import type { RefundRequest } from '../types/refund'
import { getOrderUnits } from '../utils/orderItems'
import { markItemsAs, validateRefundRequest } from './refundProcessing'
import { SAMPLE_ORDER } from './seedOrders'

const request: RefundRequest = {
  units: [
    { unit_id: 'L1-2', addon_ids: ['A1'] },
    { unit_id: 'L3-1', addon_ids: [] },
  ],
  include_delivery_fee: true,
  reason: 'wrong_item',
  reason_note: null,
  channel: 'original_payment_method',
  expected_amount: 28.8,
}

function errorCode(change: Partial<RefundRequest>) {
  const rejection = validateRefundRequest(SAMPLE_ORDER, { ...request, ...change })
  return rejection && `${rejection.status} ${rejection.body.error.code}`
}

describe('validateRefundRequest', () => {
  it('accepts a request whose amount matches the server total', () => {
    expect(validateRefundRequest(SAMPLE_ORDER, request)).toBeNull()
  })

  it('rejects an amount that differs from the server total', () => {
    expect(errorCode({ expected_amount: 28.7 })).toBe('409 AMOUNT_MISMATCH')
  })

  it('rejects a unit that is already refunded', () => {
    expect(errorCode({ units: [{ unit_id: 'L1-1', addon_ids: [] }], expected_amount: 13.9 })).toBe(
      '409 ITEMS_NOT_REFUNDABLE',
    )
  })

  it('rejects leftover add-ons whose unit is already refunded (L2-2)', () => {
    expect(errorCode({ units: [{ unit_id: 'L2-2', addon_ids: ['A2'] }], expected_amount: 1.5 })).toBe(
      '409 ITEMS_NOT_REFUNDABLE',
    )
  })

  it('rejects an add-on that does not belong to the unit', () => {
    expect(errorCode({ units: [{ unit_id: 'L3-1', addon_ids: ['A1'] }], expected_amount: 9.9 })).toBe(
      '409 ITEMS_NOT_REFUNDABLE',
    )
  })

  it('rejects a delivery fee that is already refunded', () => {
    const order = { ...SAMPLE_ORDER, delivery_fee_status: 'refunded' as const }
    const rejection = validateRefundRequest(order, { ...request, units: [], expected_amount: 5 })
    expect(rejection?.body.error.code).toBe('ITEMS_NOT_REFUNDABLE')
  })

  it('rejects an empty request and a missing note for "other"', () => {
    expect(errorCode({ units: [], include_delivery_fee: false })).toBe('422 VALIDATION_ERROR')
    expect(errorCode({ reason: 'other', reason_note: '  ' })).toBe('422 VALIDATION_ERROR')
  })
})

describe('markItemsAs', () => {
  it('marks only the requested units, their requested add-ons and the fee', () => {
    const updated = markItemsAs(SAMPLE_ORDER, request, 'refund_pending')
    const statuses = Object.fromEntries(getOrderUnits(updated).map(({ unit }) => [unit.unit_id, unit.status]))

    expect(statuses).toMatchObject({ 'L1-2': 'refund_pending', 'L3-1': 'refund_pending', 'L3-2': 'paid' })
    expect(updated.items[0].units[1].addons[0].status).toBe('refund_pending')
    expect(updated.delivery_fee_status).toBe('refund_pending')
  })

  it('leaves the original order unchanged', () => {
    markItemsAs(SAMPLE_ORDER, request, 'refund_pending')
    expect(SAMPLE_ORDER.delivery_fee_status).toBe('paid')
  })
})
