import { cn } from '../../utils/classNames'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-slate-200', className)} />
}

export function SkeletonRows({ rows, label }: { rows: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}
