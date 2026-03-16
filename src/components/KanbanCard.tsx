'use client'

import type { CardRow, Priority } from '@/types/workflow'

interface KanbanCardProps {
  card: CardRow
  onDragStart: (e: React.DragEvent<HTMLDivElement>, card: CardRow) => void
  onCardClick: (cardId: string) => void
  isNew?: boolean
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  baja: { label: 'Baja', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  media: { label: 'Media', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  alta: { label: 'Alta', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

export function KanbanCard({ card, onDragStart, onCardClick, isNew = false }: KanbanCardProps) {
  const priority = priorityConfig[card.priority]
  const MAX_VISIBLE_LABELS = 3

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('card_id', card.card_id)
    e.dataTransfer.setData('source_state_id', card.state_id)
    onDragStart(e, card)
  }

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onCardClick(card.card_id)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '10px 12px',
        cursor: 'grab',
        userSelect: 'none',
        transition: isNew ? 'opacity 0.3s ease' : undefined,
        opacity: isNew ? 0 : 1,
        animation: isNew ? 'fadeIn 0.3s ease forwards' : undefined,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent, #6366f1)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
      }}
    >
      {/* Card code */}
      {card.code && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
            marginBottom: '2px',
            display: 'block',
          }}
        >
          {card.code}
        </span>
      )}

      {/* Title */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4',
        }}
      >
        {card.title}
      </p>

      {/* Bottom row: priority badge + assignee + labels */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        {/* Priority badge */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 600,
            color: priority.color,
            background: priority.bg,
            borderRadius: '3px',
            padding: '2px 5px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {priority.label}
        </span>

        {/* Assignee avatar */}
        {card.assigned_agent_id && (
          <div
            title={card.assigned_agent_id}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '9px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {card.assigned_agent_id.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Labels */}
        {card.labels.slice(0, MAX_VISIBLE_LABELS).map((label) => (
          <span
            key={label}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--text-secondary)',
              background: 'var(--surface-alt, rgba(255,255,255,0.06))',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '1px 5px',
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
        {card.labels.length > MAX_VISIBLE_LABELS && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--text-secondary)',
            }}
          >
            +{card.labels.length - MAX_VISIBLE_LABELS}
          </span>
        )}
      </div>
    </div>
  )
}
