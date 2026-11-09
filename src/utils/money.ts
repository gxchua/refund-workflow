// Amounts are calculated in the currency's smallest unit (e.g. sen, cents) as whole numbers,
// so adding prices never produces floating point errors. Decimal places come from the currency
// (MYR has 2, JPY has 0), never hardcoded.

function getCurrencyDecimals(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * 10 ** getCurrencyDecimals(currency))
}

export function fromMinorUnits(minorUnits: number, currency: string): number {
  return minorUnits / 10 ** getCurrencyDecimals(currency)
}

/** Shows the currency code (e.g. "MYR 28.80"), because a symbol like "$" alone is unclear in a multi-country back office. */
export function formatMoney(minorUnits: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'code' }).format(
    fromMinorUnits(minorUnits, currency),
  )
}
