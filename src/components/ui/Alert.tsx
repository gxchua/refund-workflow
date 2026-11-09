import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'
import { CloseIcon } from './icons'

type AlertTone = 'info' | 'success' | 'warning' | 'error'

const TONE_CLASSES: Record<AlertTone, string> = {
  info: 'border-sky-300 bg-sky-50 text-sky-950',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  error: 'border-red-300 bg-red-50 text-red-950',
}

interface AlertProps {
  tone: AlertTone
  title?: string
  children?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
}

export function Alert({ tone, title, children, action, onDismiss }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-start gap-3 rounded-md border p-4 text-sm', TONE_CLASSES[tone])}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {action}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="focus-ring -m-2 flex size-11 items-center justify-center rounded-md hover:bg-black/5"
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
