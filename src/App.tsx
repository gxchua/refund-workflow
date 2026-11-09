import { useState } from 'react'
import { OrderPage } from './components/order/OrderPage'
import { ScenarioPanel } from './mocks/ScenarioPanel'
import { SAMPLE_ORDER } from './mocks/seedOrders'

function App() {
  // In the real back office the order ID comes from the route. Here the demo panel picks it.
  const [orderId, setOrderId] = useState(SAMPLE_ORDER.order_id)

  return (
    <>
      <OrderPage key={orderId} orderId={orderId} />
      <ScenarioPanel orderId={orderId} onOrderChange={setOrderId} />
    </>
  )
}

export default App
