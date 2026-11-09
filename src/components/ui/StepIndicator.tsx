export function StepIndicator({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <p className="text-sm text-slate-600">
      <span className="font-medium text-slate-900">
        Step {current} of {total}
      </span>
      <span aria-hidden="true"> · </span>
      {label}
    </p>
  )
}
