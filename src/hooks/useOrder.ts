import { useCallback } from 'react'
import { getOrder } from '../services/orderService'
import { useAsyncData } from './useAsyncData'

export function useOrder(orderId: string) {
  const load = useCallback(() => getOrder(orderId), [orderId])
  const { data, ...state } = useAsyncData(load)
  return { order: data, ...state }
}
