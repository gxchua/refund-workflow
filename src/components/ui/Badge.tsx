import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

export type BadgeTone = 'neutral' | 'warning' | 'info' | 'success'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border-slate-300 bg-white text-slate-700',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  info: 'border-sky-300 bg-sky-50 text-sky-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  )
}
