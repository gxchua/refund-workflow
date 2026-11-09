import type { ItemStatus } from '../../types/order'
import { Badge } from '../ui/Badge'
import { ITEM_STATUS_BADGES } from './orderLabels'

export function StatusBadge({ status }: { status: ItemStatus }) {
  const { label, tone } = ITEM_STATUS_BADGES[status]
  return <Badge tone={tone}>{label}</Badge>
}
