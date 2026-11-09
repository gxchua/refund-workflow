import { useId } from 'react'
import type { RefundDetails } from '../../types/refund'
import { RadioGroup } from '../ui/RadioGroup'
import { Select } from '../ui/Select'
import { CHANNEL_OPTIONS, REASON_OPTIONS } from './refundLabels'

const NOTE_MAX_LENGTH = 500

interface RefundDetailsFormProps {
  details: RefundDetails
  onChange: (details: RefundDetails) => void
}

export function RefundDetailsForm({ details, onChange }: RefundDetailsFormProps) {
  const id = useId()
  const update = (change: Partial<RefundDetails>) => onChange({ ...details, ...change })

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">All fields are required.</p>

      <div className="space-y-2">
        <label htmlFor={`${id}-reason`} className="block text-sm font-medium">
          Reason
        </label>
        <Select
          id={`${id}-reason`}
          value={details.reason}
          options={REASON_OPTIONS}
          placeholder="Choose a reason"
          onValueChange={(reason) => update({ reason })}
        />
      </div>

      {details.reason === 'other' && (
        <div className="space-y-2">
          <label htmlFor={`${id}-note`} className="block text-sm font-medium">
            Describe the issue
          </label>
          <textarea
            id={`${id}-note`}
            value={details.note}
            maxLength={NOTE_MAX_LENGTH}
            rows={3}
            required
            onChange={(event) => update({ note: event.target.value })}
            className="focus-ring block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <p id={`${id}-channel`} className="text-sm font-medium">
          Refund to
        </p>
        <RadioGroup
          aria-labelledby={`${id}-channel`}
          value={details.channel}
          options={CHANNEL_OPTIONS}
          onValueChange={(channel) => update({ channel })}
        />
      </div>
    </div>
  )
}
