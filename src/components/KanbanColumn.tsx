'use client'

import { useState } from 'react'
import type { BoardColumnRow, CardRow, CardType } from '@/types/workflow'
import { KanbanCard } from './KanbanCard'
import { InlineCardCreate } from './InlineCardCreate'
import { Badge, Button, cx } from '@openclaw/ui'

interface KanbanColumnProps {
  column: BoardColumnRow & { state_ids: string[] }
  cards: CardRow[]
  workflowId: string
  defaultCardType: CardType
  onDropCard: (cardId: string, targetColumn: BoardColumnRow & { state_ids: string[] }) => void
  onCardClick: (cardId: string) => void
  onCardCreated: (card: CardRow) => void
  newCardIds?: Set<string>
}

export function KanbanColumn({
  column,
  cards,
  workflowId,
  defaultCardType,
  onDropCard,
  onCardClick,
  onCardCreated,
  newCardIds,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [showInlineCreate, setShowInlineCreate] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const cardId = e.dataTransfer.getData('card_id')
    if (cardId) {
      onDropCard(cardId, column)
    }
  }

  // Sort cards by sort_order (lexicographic on the fractional index string)
  const sortedCards = [...cards].sort((a, b) => {
    if (a.sort_order < b.sort_order) return -1
    if (a.sort_order > b.sort_order) return 1
    return 0
  })

  // First state_id is the default for new cards created in this column
  const defaultStateId = column.state_ids[0] ?? ''

  const handleCardCreated = (card: CardRow) => {
    onCardCreated(card)
    // Keep inline create open for another card
  }

  const handleCancelInlineCreate = () => {
    setShowInlineCreate(false)
  }

  return (
    <div className="w-[280px] shrink-0 flex flex-col max-h-[calc(100vh-200px)]">
      {/* Column header */}
      <div
        className={cx(
          'flex items-center justify-between px-3 py-2 mb-2 border border-primary rounded-[6px]',
          column.only_humans
            ? 'bg-gradient-to-br from-amber-400/[0.08] to-amber-400/[0.04] border-l-[3px] border-l-amber-400/50'
            : 'bg-secondary'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-[13px] font-semibold text-primary">
            {column.name}
          </span>
          {/* Only-humans badge */}
          {column.only_humans && (
            <Badge variant="warning" size="sm" className="!text-[10px]">
              HUMAN ONLY
            </Badge>
          )}
          {/* Card count badge */}
          <Badge variant="gray" size="sm">
            {cards.length}
          </Badge>
        </div>

        {/* Add card button */}
        <Button
          variant="ghost"
          size="xs"
          onPress={() => setShowInlineCreate((v) => !v)}
          aria-label="Add card"
          className={cx(
            'text-lg leading-none px-1 py-0 h-auto min-h-0',
            showInlineCreate ? 'bg-secondary text-primary' : 'text-tertiary'
          )}
        >
          +
        </Button>
      </div>

      {/* Cards drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cx(
          'flex-1 overflow-y-auto flex flex-col gap-2 p-1 rounded-[6px] min-h-[80px]',
          'transition-[border-color,background] duration-150 ease-out',
          isDragOver
            ? 'border-2 border-dashed border-brand-600 bg-brand-600/[0.04]'
            : 'border-2 border-dashed border-transparent bg-transparent'
        )}
      >
        {sortedCards.map((card) => (
          <KanbanCard
            key={card.card_id}
            card={card}
            onDragStart={(e, dragCard) => {
              // Column can observe drag start if needed; card handles dataTransfer internally
              void dragCard
              void e
            }}
            onCardClick={onCardClick}
            isNew={newCardIds?.has(card.card_id)}
          />
        ))}
        {sortedCards.length === 0 && !showInlineCreate && (
          <div className="flex-1 flex items-center justify-center text-tertiary font-body text-xs opacity-50 min-h-[60px]">
            Drop here
          </div>
        )}

        {/* Inline card create — shown at bottom of column */}
        {showInlineCreate && (
          <InlineCardCreate
            workflowId={workflowId}
            stateId={defaultStateId}
            defaultCardType={defaultCardType}
            onCardCreated={handleCardCreated}
            onCancel={handleCancelInlineCreate}
          />
        )}
      </div>
    </div>
  )
}
