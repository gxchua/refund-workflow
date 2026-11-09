import type { ComponentProps } from 'react'
import type { HttpError } from '../../utils/http'
import { hasRefundableItems } from '../../utils/refundRules'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ModalBody, ModalFooter } from '../ui/Modal'
import { StepIndicator } from '../ui/StepIndicator'
import { RefundTotal } from './RefundTotal'
import { SelectableItemList } from './SelectableItemList'

interface SelectItemsStepProps extends ComponentProps<typeof SelectableItemList> {
  total: number
  isSelectionEmpty: boolean
  conflictMessage: string | null
  /** Set when reloading the order failed. The list is out of date, so Next stays disabled. */
  reloadError: HttpError | null
  isReloading: boolean
  onReload: () => void
  onCancel: () => void
  onNext: () => void
}

export function SelectItemsStep({
  total,
  isSelectionEmpty,
  conflictMessage,
  reloadError,
  isReloading,
  onReload,
  onCancel,
  onNext,
  ...listProps
}: SelectItemsStepProps) {
  const canRefund = hasRefundableItems(listProps.order)

  return (
    <>
      <ModalBody>
        <div className="space-y-4">
          {canRefund && <StepIndicator current={1} total={2} label="Select items" />}
          {conflictMessage && <Alert tone="warning">{conflictMessage}</Alert>}
          {reloadError && (
            <Alert
              tone="error"
              title="Couldn't load the latest order"
              action={
                <Button variant="secondary" onClick={onReload}>
                  Retry
                </Button>
              }
            >
              {reloadError.message}
            </Alert>
          )}
          {!canRefund && <Alert tone="info">Nothing left to refund on this order.</Alert>}
          <SelectableItemList {...listProps} />
        </div>
      </ModalBody>
      <ModalFooter>
        {canRefund ? (
          <>
            <RefundTotal amount={total} currency={listProps.order.currency} locale={listProps.locale} />
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onNext} disabled={isSelectionEmpty || reloadError !== null} isLoading={isReloading}>
              Next
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
        )}
      </ModalFooter>
    </>
  )
}
