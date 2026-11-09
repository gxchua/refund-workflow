import { Money } from '../ui/Money'

export function RefundTotal({ amount, currency, locale }: { amount: number; currency: string; locale: string }) {
  return (
    <p className="mr-auto flex items-baseline gap-2" aria-live="polite">
      <span className="text-sm text-slate-600">Refund total</span>
      <Money amount={amount} currency={currency} locale={locale} className="text-lg font-semibold" />
    </p>
  )
}
