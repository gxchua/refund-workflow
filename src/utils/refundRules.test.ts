import { describe, expect, it } from 'vitest'
import { SAMPLE_ORDER } from '../mocks/seedOrders'
import type { Order, OrderUnit } from '../types/order'
import type { RefundDetails } from '../types/refund'
import { getOrderUnits } from './orderItems'
import {
  hasRefundableItems,
  isAddonLockedByUnit,
  isAddonRefundable,
  isDeliveryFeeRefundable,
  isRefundDetailsComplete,
  isUnitRefundable,
} from './refundRules'

function findUnit(order: Order, unitId: string): OrderUnit {
  const entry = getOrderUnits(order).find(({ unit }) => unit.unit_id === unitId)
  if (!entry) throw new Error(`Unit ${unitId} not in order`)
  return entry.unit
}

const latte = findUnit(SAMPLE_ORDER, 'L1-2')
const refundedLatte = findUnit(SAMPLE_ORDER, 'L1-1')
const americano = findUnit(SAMPLE_ORDER, 'L2-1')
const refundedAmericano = findUnit(SAMPLE_ORDER, 'L2-2')

describe('isUnitRefundable', () => {
  it('allows only paid units', () => {
    expect(isUnitRefundable(latte)).toBe(true)
    expect(isUnitRefundable(refundedLatte)).toBe(false)
    expect(isUnitRefundable({ ...latte, status: 'refund_pending' })).toBe(false)
  })
})

describe('isAddonRefundable', () => {
  it('allows a paid add-on on a paid unit', () => {
    expect(isAddonRefundable(americano, americano.addons[0])).toBe(true)
  })

  it('blocks a refunded add-on', () => {
    expect(isAddonRefundable(refundedLatte, refundedLatte.addons[0])).toBe(false)
  })

  it('blocks a paid add-on whose unit is already refunded (L2-2)', () => {
    expect(isAddonRefundable(refundedAmericano, refundedAmericano.addons[0])).toBe(false)
  })
})

describe('isAddonLockedByUnit', () => {
  it('is true for a paid add-on whose unit is refunded or pending', () => {
    expect(isAddonLockedByUnit(refundedAmericano, refundedAmericano.addons[0])).toBe(true)
    const pendingAmericano = { ...americano, status: 'refund_pending' as const }
    expect(isAddonLockedByUnit(pendingAmericano, pendingAmericano.addons[0])).toBe(true)
  })

  it('is false when the add-on itself is refunded, or its unit is still paid', () => {
    expect(isAddonLockedByUnit(refundedLatte, refundedLatte.addons[0])).toBe(false)
    expect(isAddonLockedByUnit(americano, americano.addons[0])).toBe(false)
  })
})

describe('isDeliveryFeeRefundable', () => {
  it('allows a paid fee', () => {
    expect(isDeliveryFeeRefundable(SAMPLE_ORDER)).toBe(true)
  })

  it('blocks a fee that is zero, pending or refunded', () => {
    expect(isDeliveryFeeRefundable({ ...SAMPLE_ORDER, delivery_fee: 0 })).toBe(false)
    expect(isDeliveryFeeRefundable({ ...SAMPLE_ORDER, delivery_fee_status: 'refund_pending' })).toBe(false)
    expect(isDeliveryFeeRefundable({ ...SAMPLE_ORDER, delivery_fee_status: 'refunded' })).toBe(false)
  })
})

describe('hasRefundableItems', () => {
  function refundAllUnits(order: Order): Order {
    const updated = structuredClone(order)
    for (const { unit } of getOrderUnits(updated)) unit.status = 'refunded'
    return updated
  }

  it('is true while a unit or the fee is still paid', () => {
    expect(hasRefundableItems(SAMPLE_ORDER)).toBe(true)
    expect(hasRefundableItems(refundAllUnits(SAMPLE_ORDER))).toBe(true)
  })

  it('is false when every unit and the fee are refunded, even with leftover paid add-ons', () => {
    expect(hasRefundableItems({ ...refundAllUnits(SAMPLE_ORDER), delivery_fee_status: 'refunded' })).toBe(false)
  })
})

describe('isRefundDetailsComplete', () => {
  const complete: RefundDetails = { reason: 'wrong_item', note: '', channel: 'in_app_credit' }

  it('needs a reason and a channel', () => {
    expect(isRefundDetailsComplete(complete)).toBe(true)
    expect(isRefundDetailsComplete({ ...complete, reason: null })).toBe(false)
    expect(isRefundDetailsComplete({ ...complete, channel: null })).toBe(false)
  })

  it('needs a note that is not blank when the reason is "other"', () => {
    expect(isRefundDetailsComplete({ ...complete, reason: 'other' })).toBe(false)
    expect(isRefundDetailsComplete({ ...complete, reason: 'other', note: '   ' })).toBe(false)
    expect(isRefundDetailsComplete({ ...complete, reason: 'other', note: 'Cup was leaking' })).toBe(true)
  })
})
