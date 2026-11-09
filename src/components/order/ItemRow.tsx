import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface ItemRowProps {
  name: string
  detail?: string
  price: ReactNode
  /** Shown under the name: a status badge or the reason a row can't be selected. */
  meta?: ReactNode
  isAddon?: boolean
  /** A checkbox. With `controlId`, the whole row toggles it. */
  control?: ReactNode
  controlId?: string
  isDisabled?: boolean
}

/** One row of the item list, shared by the order page and the refund selection. */
export function ItemRow({ name, detail, price, meta, isAddon, control, controlId, isDisabled }: ItemRowProps) {
  const isToggleable = Boolean(controlId) && !isDisabled
  const content = (
    <>
      {control && <span className="flex h-6 items-center">{control}</span>}
      <span className="min-w-0 flex-1">
        <span className={cn('block break-words', isAddon ? 'text-sm' : 'font-medium')}>
          {name}
          {detail && <span className="ml-2 text-sm font-normal text-slate-500">{detail}</span>}
        </span>
        {meta && <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">{meta}</span>}
      </span>
      <span className={cn('text-right', isAddon && 'text-sm text-slate-700')}>{price}</span>
    </>
  )

  const className = cn(
    'flex min-h-11 items-start gap-3 rounded-md px-2 py-2.5',
    isAddon && 'ml-8',
    isDisabled && 'text-slate-500',
    isToggleable && 'cursor-pointer hover:bg-slate-50',
  )

  return controlId ? (
    <label htmlFor={controlId} className={className}>
      {content}
    </label>
  ) : (
    <div className={className}>{content}</div>
  )
}
