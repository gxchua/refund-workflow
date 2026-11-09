import type { ComponentProps } from 'react'
import { Button } from '../ui/Button'
import { ModalBody, ModalFooter } from '../ui/Modal'
import { StepIndicator } from '../ui/StepIndicator'
import { RefundDetailsForm } from './RefundDetailsForm'
import { RefundSummary } from './RefundSummary'
import { RefundTotal } from './RefundTotal'

type ReviewStepProps = ComponentProps<typeof RefundSummary> &
  ComponentProps<typeof RefundDetailsForm> & {
    canConfirm: boolean
    onBack: () => void
    onConfirm: () => void
  }

export function ReviewStep({ details, onChange, canConfirm, onBack, onConfirm, ...summaryProps }: ReviewStepProps) {
  return (
    <>
      <ModalBody>
        <div className="space-y-5">
          <StepIndicator current={2} total={2} label="Review and details" />
          <RefundSummary {...summaryProps} />
          <RefundDetailsForm details={details} onChange={onChange} />
        </div>
      </ModalBody>
      <ModalFooter>
        <RefundTotal amount={summaryProps.total} currency={summaryProps.order.currency} locale={summaryProps.locale} />
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm}>
          Confirm
        </Button>
      </ModalFooter>
    </>
  )
}
