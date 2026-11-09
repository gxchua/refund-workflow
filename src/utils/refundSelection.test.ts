import { describe, expect, it } from 'vitest'
import { SAMPLE_ORDER } from '../mocks/seedOrders'
import type { Order, OrderUnit } from '../types/order'
import {
  EMPTY_SELECTION,
  getSelectAllState,
  isFullRefund,
  keepValidSelection,
  selectAll,
  toggleAddon,
  toggleDeliveryFee,
  toggleUnit,
} from './refundSelection'

function findUnit(order: Order, unitId: string): OrderUnit {
  const unit = order.items.flatMap((line) => line.units).find((item) => item.unit_id === unitId)
  if (!unit) throw new Error(`Unit ${unitId} not in order`)
  return unit
}

const latte = findUnit(SAMPLE_ORDER, 'L1-2')
const americano = findUnit(SAMPLE_ORDER, 'L2-1')

describe('toggleUnit', () => {
  it('ticks the unit together with its paid add-ons', () => {
    expect(toggleUnit(EMPTY_SELECTION, americano).units).toEqual({ 'L2-1': ['A2', 'A3'] })
  })

  it('unticking a unit removes its add-ons too', () => {
    const selected = toggleUnit(EMPTY_SELECTION, americano)
    expect(toggleUnit(selected, americano).units).toEqual({})
  })

  it('does nothing for a unit that is not refundable', () => {
    expect(toggleUnit(EMPTY_SELECTION, findUnit(SAMPLE_ORDER, 'L1-1'))).toBe(EMPTY_SELECTION)
  })
})

describe('toggleAddon', () => {
  it('unticks one add-on and keeps the unit selected', () => {
    const selected = toggleUnit(EMPTY_SELECTION, americano)
    expect(toggleAddon(selected, americano, 'A2').units).toEqual({ 'L2-1': ['A3'] })
  })

  it('cannot tick an add-on while its unit is not selected', () => {
    expect(toggleAddon(EMPTY_SELECTION, latte, 'A1')).toBe(EMPTY_SELECTION)
  })

  it('cannot tick a paid add-on whose unit is already refunded', () => {
    expect(toggleAddon({ units: { 'L2-2': [] }, includeDeliveryFee: false }, findUnit(SAMPLE_ORDER, 'L2-2'), 'A2').units)
      .toEqual({ 'L2-2': [] })
  })
})

describe('selectAll and getSelectAllState', () => {
  it('selects every refundable unit, add-on and the delivery fee', () => {
    expect(selectAll(SAMPLE_ORDER)).toEqual({
      units: { 'L1-2': ['A1'], 'L2-1': ['A2', 'A3'], 'L3-1': [], 'L3-2': [], 'L3-3': [] },
      includeDeliveryFee: true,
    })
  })

  it('reports none, some or all selected', () => {
    expect(getSelectAllState(SAMPLE_ORDER, EMPTY_SELECTION)).toBe(false)
    expect(getSelectAllState(SAMPLE_ORDER, toggleUnit(EMPTY_SELECTION, latte))).toBe('indeterminate')
    expect(getSelectAllState(SAMPLE_ORDER, selectAll(SAMPLE_ORDER))).toBe(true)
  })
})

describe('isFullRefund', () => {
  it('is true when every refundable item is selected, with or without the delivery fee', () => {
    const allItems = selectAll(SAMPLE_ORDER)
    expect(isFullRefund(SAMPLE_ORDER, allItems)).toBe(true)
    expect(isFullRefund(SAMPLE_ORDER, toggleDeliveryFee(allItems, SAMPLE_ORDER))).toBe(true)
  })

  it('is false when an add-on is left out', () => {
    expect(isFullRefund(SAMPLE_ORDER, toggleAddon(selectAll(SAMPLE_ORDER), latte, 'A1'))).toBe(false)
  })

  it('is false for a delivery-fee-only refund', () => {
    expect(isFullRefund(SAMPLE_ORDER, toggleDeliveryFee(EMPTY_SELECTION, SAMPLE_ORDER))).toBe(false)
  })
})

describe('keepValidSelection', () => {
  it('drops items that became non-refundable and keeps the rest', () => {
    const updated: Order = structuredClone(SAMPLE_ORDER)
    findUnit(updated, 'L1-2').status = 'refunded'
    updated.delivery_fee_status = 'refund_pending'

    const before = { units: { 'L1-2': ['A1'], 'L3-1': [] }, includeDeliveryFee: true }
    expect(keepValidSelection(updated, before)).toEqual({ units: { 'L3-1': [] }, includeDeliveryFee: false })
  })

  it('drops add-ons together with their unit, and a locked add-on on its own', () => {
    const updated: Order = structuredClone(SAMPLE_ORDER)
    findUnit(updated, 'L2-1').status = 'refund_pending'
    findUnit(updated, 'L1-2').addons[0].status = 'refunded'

    const before = { units: { 'L1-2': ['A1'], 'L2-1': ['A2', 'A3'], 'L3-1': [] }, includeDeliveryFee: false }
    expect(keepValidSelection(updated, before)).toEqual({
      units: { 'L1-2': [], 'L3-1': [] },
      includeDeliveryFee: false,
    })
  })
})
