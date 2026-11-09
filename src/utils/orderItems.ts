import type { Order, OrderLine, OrderUnit } from '../types/order'

interface OrderUnitEntry {
  line: OrderLine
  unit: OrderUnit
  /** 1-based position of the unit within its line, e.g. "2 of 3". */
  position: number
  lineQuantity: number
}

export function getOrderUnits(order: Order): OrderUnitEntry[] {
  return order.items.flatMap((line) =>
    line.units.map((unit, index) => ({ line, unit, position: index + 1, lineQuantity: line.units.length })),
  )
}

export function hasDeliveryFee(order: Order): boolean {
  return order.delivery_fee > 0
}
