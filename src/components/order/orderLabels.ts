import type { ItemStatus, OrderStatus } from '../../types/order'
import type { BadgeTone } from '../ui/Badge'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  completed: 'Completed',
}

export const ITEM_STATUS_BADGES: Record<ItemStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'neutral' },
  refund_pending: { label: 'Refund pending', tone: 'warning' },
  refunded: { label: 'Refunded', tone: 'info' },
}

/** "2 of 3" when a line has more than one unit, so identical rows can be told apart. */
export function getUnitPositionLabel(position: number, lineQuantity: number): string | undefined {
  return lineQuantity > 1 ? `${position} of ${lineQuantity}` : undefined
}
