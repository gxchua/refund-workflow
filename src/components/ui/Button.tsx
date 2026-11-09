import type { ComponentProps } from 'react'
import { cn } from '../../utils/classNames'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-strong disabled:bg-slate-300 disabled:text-slate-600',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:text-slate-400',
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  )
}
