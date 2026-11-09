import { Checkbox as RadixCheckbox } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../utils/classNames'
import { CheckIcon, MinusIcon } from './icons'

export function Checkbox({ className, checked, ...props }: ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      className={cn(
        'focus-ring flex size-5 shrink-0 items-center justify-center rounded border border-slate-400 bg-white text-white',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        'disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100',
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator>
        {checked === 'indeterminate' ? <MinusIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
