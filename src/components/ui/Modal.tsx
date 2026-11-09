import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

/**
 * Centred on desktop, nearly full screen on tablet. Children are unmounted when the modal closes,
 * so any state inside them resets.
 */
export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
        <Dialog.Content
          aria-describedby={undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-lg bg-white shadow-xl lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[85dvh] lg:w-[min(44rem,calc(100vw-4rem))] lg:-translate-1/2"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-3">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="focus-ring -mr-3 flex size-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            >
              <CloseIcon className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
      {children}
    </div>
  )
}
