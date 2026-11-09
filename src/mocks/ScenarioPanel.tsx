import { type ComponentProps, useId, useState, useSyncExternalStore } from 'react'
import { ChevronDownIcon } from '../components/ui/icons'
import { resetDatabase } from './mockDatabase'
import { getScenario, SCENARIO_OPTIONS, type Scenario, setScenario, subscribeToScenario } from './scenario'
import { SEED_ORDERS } from './seedOrders'

interface ScenarioPanelProps {
  orderId: string
  onOrderChange: (orderId: string) => void
}

function PanelSelect(props: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="focus-ring min-h-11 w-full appearance-none rounded border border-fuchsia-400 bg-white pr-8 pl-2"
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
    </div>
  )
}

/**
 * Demo tool for reviewers to pick a sample order and trigger mock API behaviour. Not part of the
 * product, so it lives with the mocks and is styled to look different on purpose.
 */
export function ScenarioPanel({ orderId, onOrderChange }: ScenarioPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const scenario = useSyncExternalStore(subscribeToScenario, getScenario)
  const id = useId()

  function handleReset() {
    resetDatabase()
    setScenario('normal')
    window.location.reload()
  }

  return (
    <aside className="fixed bottom-4 left-4 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-md border-2 border-dashed border-fuchsia-500 bg-fuchsia-50 font-mono text-xs text-fuchsia-950 shadow-lg">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="focus-ring flex min-h-11 w-full items-center justify-between gap-2 px-3 font-semibold"
      >
        <span>Demo: API scenario</span>
        <span>{isOpen ? 'Hide' : SCENARIO_OPTIONS.find((option) => option.value === scenario)?.label}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-dashed border-fuchsia-400 p-3">
          <label htmlFor={`${id}-order`} className="block">
            Sample order
          </label>
          <PanelSelect
            id={`${id}-order`}
            value={orderId}
            onChange={(event) => onOrderChange(event.target.value)}
          >
            {SEED_ORDERS.map(({ order, description }) => (
              <option key={order.order_id} value={order.order_id}>
                {order.order_id}: {description}
              </option>
            ))}
          </PanelSelect>

          <label htmlFor={`${id}-scenario`} className="block">
            Next API response
          </label>
          <PanelSelect
            id={`${id}-scenario`}
            value={scenario}
            onChange={(event) => setScenario(event.target.value as Scenario)}
          >
            {SCENARIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </PanelSelect>
          <p>Refund failures apply to the next refund only, then switch back to Normal.</p>
          <p>Slow and "Order fails to load" stay on until changed. They affect loading the order and opening a refund.</p>
          <button
            type="button"
            onClick={handleReset}
            className="focus-ring min-h-11 w-full rounded border border-fuchsia-500 bg-white font-semibold hover:bg-fuchsia-100"
          >
            Reset data
          </button>
        </div>
      )}
    </aside>
  )
}
