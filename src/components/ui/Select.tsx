import { Select as RadixSelect } from 'radix-ui'
import { CheckIcon, ChevronDownIcon } from './icons'
import type { Option } from './options'

interface SelectProps<T extends string> {
  id?: string
  value: T | null
  options: Option<T>[]
  placeholder: string
  onValueChange: (value: T) => void
  disabled?: boolean
}

export function Select<T extends string>({ id, value, options, placeholder, onValueChange, disabled }: SelectProps<T>) {
  return (
    <RadixSelect.Root value={value ?? ''} onValueChange={(next) => onValueChange(next as T)} disabled={disabled}>
      <RadixSelect.Trigger
        id={id}
        className="focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-left text-sm data-placeholder:text-slate-500"
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDownIcon className="size-4 text-slate-500" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-60 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex min-h-11 cursor-pointer items-center rounded py-2 pr-3 pl-8 text-sm outline-none select-none data-highlighted:bg-primary-soft"
              >
                <RadixSelect.ItemIndicator className="absolute left-2">
                  <CheckIcon className="size-4 text-primary" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
