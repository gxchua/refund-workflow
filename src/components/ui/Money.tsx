import { cn } from '../../utils/classNames'
import { formatMoney } from '../../utils/money'

interface MoneyProps {
  /** Amount in the currency's smallest unit, e.g. 1390 for RM 13.90. */
  amount: number
  currency: string
  locale: string
  className?: string
}

export function Money({ amount, currency, locale, className }: MoneyProps) {
  return <span className={cn('tabular-nums whitespace-nowrap', className)}>{formatMoney(amount, currency, locale)}</span>
}
