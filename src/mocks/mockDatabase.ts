import type { Order } from '../types/order'
import type { CreateRefundResponse } from '../types/refund'
import { SEED_ORDERS } from './seedOrders'

interface StoredRefund {
  orderId: string
  requestBody: string
  response: CreateRefundResponse
}

interface MockDatabase {
  orders: Record<string, Order>
  refundsByIdempotencyKey: Record<string, StoredRefund>
  refundCount: number
}

// Bump the version when the seed data changes, so old saved data is ignored.
const STORAGE_KEY = 'refund-workflow:mock-database:v4'

function createSeedDatabase(): MockDatabase {
  return {
    orders: Object.fromEntries(SEED_ORDERS.map(({ order }) => [order.order_id, structuredClone(order)])),
    refundsByIdempotencyKey: {},
    refundCount: 0,
  }
}

export function readDatabase(): MockDatabase {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as MockDatabase
  } catch {
    // Storage unavailable or corrupted: fall back to the seed data.
  }
  return createSeedDatabase()
}

export function writeDatabase(database: MockDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  } catch {
    // Storage unavailable: changes last until the page reloads.
  }
}

export function resetDatabase(): void {
  writeDatabase(createSeedDatabase())
}
