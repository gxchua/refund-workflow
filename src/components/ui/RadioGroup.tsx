import { RadioGroup as RadixRadioGroup } from 'radix-ui'
import { useId } from 'react'
import type { Option } from './options'

interface RadioGroupProps<T extends string> {
  value: T | null
  options: Option<T>[]
  onValueChange: (value: T) => void
  'aria-labelledby'?: string
}

export function RadioGroup<T extends string>({ value, options, onValueChange, ...ariaProps }: RadioGroupProps<T>) {
  const groupId = useId()

  return (
    <RadixRadioGroup.Root
      value={value ?? ''}
      onValueChange={(next) => onValueChange(next as T)}
      className="grid gap-2"
      {...ariaProps}
    >
      {options.map((option) => {
        const itemId = `${groupId}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={itemId}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-slate-300 bg-white p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary-soft"
          >
            <RadixRadioGroup.Item
              id={itemId}
              value={option.value}
              className="focus-ring mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-400 bg-white data-[state=checked]:border-primary"
            >
              <RadixRadioGroup.Indicator className="size-2.5 rounded-full bg-primary" />
            </RadixRadioGroup.Item>
            <span className="min-w-0 text-sm">
              <span className="block font-medium">{option.label}</span>
              {option.description && <span className="block text-slate-600">{option.description}</span>}
            </span>
          </label>
        )
      })}
    </RadixRadioGroup.Root>
  )
}
