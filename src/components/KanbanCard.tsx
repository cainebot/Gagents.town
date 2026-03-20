'use client'

import type { CardRow, Priority } from '@/types/workflow'
import { PriorityBadge } from '@/components/atoms/PriorityBadge'
import { Badge, cx } from '@openclaw/ui'

interface KanbanCardProps {
  card: CardRow
  onDragStart: (e: React.DragEvent<HTMLDivElement>, card: CardRow) => void
  onCardClick: (cardId: string) => void
  isNew?: boolean
}

const PRIORITY_LEFT_BORDER: Record<Priority, string> = {
  critica: '#ef4444',
  alta:    '#f97316',
  media:   '#eab308',
  baja:    'var(--border-primary)',
}

const MAX_VISIBLE_LABELS = 3

function isDueOverdue(dueDate: string): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

function isDueToday(dueDate: string): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0)
  return due.getTime() === today.getTime()
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function KanbanCard({ card, onDragStart, onCardClick, isNew = false }: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('card_id', card.card_id)
    e.dataTransfer.setData('source_state_id', card.state_id)
    onDragStart(e, card)
  }

  const handlePriorityChange = async (newPriority: Priority) => {
    try {
      await fetch(`/api/cards/${card.card_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
    } catch {
      // silent — board will revert on next realtime sync
    }
  }

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onCardClick(card.card_id)}
      className={cx(
        'bg-secondary border border-primary rounded-lg px-3 py-2.5 cursor-grab select-none',
        'shadow-[0_1px_2px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.06)]',
        'transition-[transform,box-shadow] duration-150 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.08)]',
        isNew && 'animate-kanban-fade-in'
      )}
      style={{ borderLeft: `3px solid ${PRIORITY_LEFT_BORDER[card.priority]}` }}
    >
      {/* Row 1 — Priority badge + code */}
      <div className="flex items-center justify-between mb-1.5">
        <PriorityBadge
          priority={card.priority}
          editable={true}
          onChange={handlePriorityChange}
        />
        {card.code && (
          <span className="font-body text-[10px] font-bold text-quaternary">
            {card.code}
          </span>
        )}
      </div>

      {/* Row 2 — Title */}
      <p className="font-body text-[13px] font-medium text-primary m-0 mb-1.5 line-clamp-2 leading-[1.4]">
        {card.title}
      </p>

      {/* Row 3 — Labels */}
      {card.labels.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1.5">
          {card.labels.slice(0, MAX_VISIBLE_LABELS).map((label) => (
            <Badge
              key={label}
              variant="gray"
              size="sm"
              className="max-w-[80px] truncate uppercase tracking-[0.4px] !text-[10px] !font-bold"
            >
              {label}
            </Badge>
          ))}
          {card.labels.length > MAX_VISIBLE_LABELS && (
            <span className="font-body text-[10px] text-tertiary">
              +{card.labels.length - MAX_VISIBLE_LABELS}
            </span>
          )}
        </div>
      )}

      {/* Row 4 — Assignee + Due date */}
      {(card.assigned_agent_id || card.due_date) && (
        <div className="flex items-center justify-between gap-1">
          {card.assigned_agent_id && (
            <div className="flex items-center gap-1">
              <div className="size-4 rounded-full bg-tertiary border border-primary flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-tertiary">
                  {card.assigned_agent_id.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          {card.due_date && (
            <span
              className={cx(
                'font-body text-[10px] font-medium ml-auto',
                isDueOverdue(card.due_date)
                  ? 'text-error-600'
                  : isDueToday(card.due_date)
                    ? 'text-warning-600'
                    : 'text-quaternary'
              )}
            >
              {formatDueDate(card.due_date)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
