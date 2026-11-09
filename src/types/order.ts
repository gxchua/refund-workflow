export type ItemStatus = 'paid' | 'refund_pending' | 'refunded'

export type OrderStatus = 'completed'

export interface Addon {
  addon_id: string
  name: string
  unit_price: number
  status: ItemStatus
}

export interface OrderUnit {
  unit_id: string
  status: ItemStatus
  addons: Addon[]
}

export interface OrderLine {
  line_id: string
  name: string
  unit_price: number
  units: OrderUnit[]
}

export interface Order {
  order_id: string
  status: OrderStatus
  country: string
  store_id: string
  placed_at: string
  currency: string
  delivery_fee: number
  delivery_fee_status: ItemStatus
  items: OrderLine[]
}
