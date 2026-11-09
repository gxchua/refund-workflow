import { describe, expect, it } from 'vitest'
import { SAMPLE_ORDER } from '../mocks/seedOrders'
import type { Order } from '../types/order'
import type { RefundSelection } from '../types/refund'
import { calculateRefundTotal } from './refundCalculation'

function selection(units: RefundSelection['units'], includeDeliveryFee = false): RefundSelection {
  return { units, includeDeliveryFee }
}

describe('calculateRefundTotal', () => {
  it('returns 0 when nothing is selected', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({}))).toBe(0)
  })

  it('counts a unit without its add-ons', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L1-2': [] }))).toBe(1390)
  })

  it('counts a unit with its selected add-ons', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L1-2': ['A1'] }))).toBe(1590)
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L2-1': ['A2'] }))).toBe(1340)
  })

  it('adds the delivery fee when included', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L1-2': ['A1'], 'L3-1': [] }, true))).toBe(2880)
  })

  it('allows refunding only the delivery fee', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({}, true))).toBe(500)
  })

  it('adds decimal prices without floating point errors', () => {
    const allCroissants = selection({ 'L3-1': [], 'L3-2': [], 'L3-3': [] })
    expect(calculateRefundTotal(SAMPLE_ORDER, allCroissants)).toBe(2370)
  })

  it('totals everything still refundable', () => {
    const everything = selection({ 'L1-2': ['A1'], 'L2-1': ['A2', 'A3'], 'L3-1': [], 'L3-2': [], 'L3-3': [] }, true)
    expect(calculateRefundTotal(SAMPLE_ORDER, everything)).toBe(5900)
  })

  it('ignores units and add-ons that are already refunded', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L1-1': ['A1'] }))).toBe(0)
  })

  it('ignores paid add-ons whose unit is already refunded', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L2-2': ['A2', 'A3'] }))).toBe(0)
  })

  it('ignores add-on IDs that belong to a different unit', () => {
    expect(calculateRefundTotal(SAMPLE_ORDER, selection({ 'L3-1': ['A1'] }))).toBe(790)
  })

  it('ignores items that are pending a refund', () => {
    const order: Order = structuredClone(SAMPLE_ORDER)
    order.items[2].units[0].status = 'refund_pending'
    order.delivery_fee_status = 'refund_pending'
    expect(calculateRefundTotal(order, selection({ 'L3-1': [] }, true))).toBe(0)
  })

  it('ignores the delivery fee when there is none', () => {
    const order: Order = { ...structuredClone(SAMPLE_ORDER), delivery_fee: 0 }
    expect(calculateRefundTotal(order, selection({}, true))).toBe(0)
  })
})
