import { AlertDialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  busyLabel?: string
  /** While busy, both buttons are disabled and Esc does nothing. */
  isBusy?: boolean
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  busyLabel,
  isBusy = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => isBusy && event.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-1/2 space-y-4 rounded-lg bg-white p-6 shadow-xl"
        >
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-slate-700">{description}</AlertDialog.Description>
          {children}
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={isBusy}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button isLoading={isBusy} onClick={onConfirm}>
              {isBusy && busyLabel ? busyLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
