import type { Order } from '../types/order'
import { get } from '../utils/http'

export function getOrder(orderId: string): Promise<Order> {
  return get<Order>(`/orders/${encodeURIComponent(orderId)}`)
}
