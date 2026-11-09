export type Scenario =
  | 'normal'
  | 'slow'
  | 'loading_fails'
  | 'refund_fails'
  | 'refund_times_out'
  | 'item_already_refunded'
  | 'amount_mismatch'

export const SCENARIO_OPTIONS: Array<{ value: Scenario; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Slow (3s)' },
  { value: 'loading_fails', label: 'Order fails to load' },
  { value: 'refund_fails', label: 'Refund fails' },
  { value: 'refund_times_out', label: 'Refund times out' },
  { value: 'item_already_refunded', label: 'Item refunded by someone else' },
  { value: 'amount_mismatch', label: 'Amount mismatch' },
]

const STORAGE_KEY = 'refund-workflow:scenario'
const listeners = new Set<() => void>()

function readStoredScenario(): Scenario {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (SCENARIO_OPTIONS.some((option) => option.value === stored)) return stored as Scenario
  } catch {
    // Storage unavailable: use the default.
  }
  return 'normal'
}

let currentScenario = readStoredScenario()

export function getScenario(): Scenario {
  return currentScenario
}

export function setScenario(scenario: Scenario): void {
  currentScenario = scenario
  try {
    sessionStorage.setItem(STORAGE_KEY, scenario)
  } catch {
    // Storage unavailable: the scenario lasts until the page reloads.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToScenario(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Refund failures fire once, then switch back to Normal so "Try again" can succeed while the
 * modal blocks the panel. Slow and "Order fails to load" stay on until changed in the panel.
 */
export function endOneTimeScenario(): void {
  setScenario('normal')
}
