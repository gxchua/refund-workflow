import type { Order } from '../types/order'

export const SAMPLE_ORDER: Order = {
  order_id: 'ORD-10482',
  status: 'completed',
  country: 'MY',
  store_id: 'MY-KL-001',
  placed_at: '2026-10-26T01:15:00Z',
  currency: 'MYR',
  delivery_fee: 5.0,
  delivery_fee_status: 'paid',
  items: [
    {
      line_id: 'L1',
      name: 'Iced Spanish Latte',
      unit_price: 13.9,
      units: [
        {
          unit_id: 'L1-1',
          status: 'refunded',
          addons: [{ addon_id: 'A1', name: 'Extra Shot', unit_price: 2.0, status: 'refunded' }],
        },
        {
          unit_id: 'L1-2',
          status: 'paid',
          addons: [{ addon_id: 'A1', name: 'Extra Shot', unit_price: 2.0, status: 'paid' }],
        },
      ],
    },
    {
      line_id: 'L2',
      name: 'Hazelnut Americano with Oat Milk and Brown Sugar Syrup',
      unit_price: 11.9,
      units: [
        {
          unit_id: 'L2-1',
          status: 'paid',
          addons: [
            { addon_id: 'A2', name: 'Oat Milk', unit_price: 1.5, status: 'paid' },
            { addon_id: 'A3', name: 'Brown Sugar Syrup', unit_price: 1.0, status: 'paid' },
          ],
        },
        {
          unit_id: 'L2-2',
          status: 'refunded',
          addons: [
            { addon_id: 'A2', name: 'Oat Milk', unit_price: 1.5, status: 'paid' },
            { addon_id: 'A3', name: 'Brown Sugar Syrup', unit_price: 1.0, status: 'paid' },
          ],
        },
      ],
    },
    {
      line_id: 'L3',
      name: 'Butter Croissant',
      unit_price: 7.9,
      units: [
        { unit_id: 'L3-1', status: 'paid', addons: [] },
        { unit_id: 'L3-2', status: 'paid', addons: [] },
        { unit_id: 'L3-3', status: 'paid', addons: [] },
      ],
    },
  ],
}

const PICKUP_ORDER: Order = {
  order_id: 'ORD-10483',
  status: 'completed',
  country: 'MY',
  store_id: 'MY-KL-001',
  placed_at: '2026-10-26T02:02:00Z',
  currency: 'MYR',
  delivery_fee: 0,
  delivery_fee_status: 'paid',
  items: [
    {
      line_id: 'L1',
      name: 'Caramel Macchiato',
      unit_price: 12.9,
      units: [
        {
          unit_id: 'L1-1',
          status: 'paid',
          addons: [{ addon_id: 'A1', name: 'Extra Shot', unit_price: 2.0, status: 'paid' }],
        },
      ],
    },
    {
      line_id: 'L2',
      name: 'Chocolate Muffin',
      unit_price: 6.9,
      units: [{ unit_id: 'L2-1', status: 'paid', addons: [] }],
    },
  ],
}

const PENDING_REFUND_ORDER: Order = {
  order_id: 'ORD-10490',
  status: 'completed',
  country: 'MY',
  store_id: 'MY-KL-003',
  placed_at: '2026-10-27T00:41:00Z',
  currency: 'MYR',
  delivery_fee: 5.0,
  delivery_fee_status: 'paid',
  items: [
    {
      line_id: 'L1',
      name: 'Americano',
      unit_price: 9.9,
      units: [
        { unit_id: 'L1-1', status: 'refund_pending', addons: [] },
        { unit_id: 'L1-2', status: 'paid', addons: [] },
      ],
    },
  ],
}

const FULLY_REFUNDED_ORDER: Order = {
  order_id: 'ORD-10475',
  status: 'completed',
  country: 'MY',
  store_id: 'MY-PJ-002',
  placed_at: '2026-10-25T07:20:00Z',
  currency: 'MYR',
  delivery_fee: 4.0,
  delivery_fee_status: 'refunded',
  items: [
    {
      line_id: 'L1',
      name: 'Iced Matcha Latte',
      unit_price: 14.9,
      units: [
        {
          unit_id: 'L1-1',
          status: 'refunded',
          addons: [{ addon_id: 'A1', name: 'Oat Milk', unit_price: 1.5, status: 'refunded' }],
        },
      ],
    },
  ],
}

/** The PDF's order plus one order per state it can't show: no delivery fee, a pending refund, nothing left. */
export const SEED_ORDERS: Array<{ order: Order; description: string }> = [
  { order: SAMPLE_ORDER, description: 'sample from the brief' },
  { order: PICKUP_ORDER, description: 'no delivery fee' },
  { order: PENDING_REFUND_ORDER, description: 'refund pending' },
  { order: FULLY_REFUNDED_ORDER, description: 'nothing left to refund' },
]
