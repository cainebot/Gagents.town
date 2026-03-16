'use client'

import type { BoardWithColumns, CardRow, BoardColumnRow } from '@/types/workflow'
import { KanbanColumn } from './KanbanColumn'

interface BoardKanbanProps {
  board: BoardWithColumns
  cards: CardRow[]
  onMoveCard: (cardId: string, newStateId: string) => void
  onReorderCard: (cardId: string, newSortOrder: string) => void
  onCardClick: (cardId: string) => void
  newCardIds?: Set<string>
}

export function BoardKanban({
  board,
  cards,
  onMoveCard,
  onReorderCard,
  onCardClick,
  newCardIds,
}: BoardKanbanProps) {
  // Group cards by state_id
  const cardsByStateId = cards.reduce<Record<string, CardRow[]>>((acc, card) => {
    if (!acc[card.state_id]) acc[card.state_id] = []
    acc[card.state_id].push(card)
    return acc
  }, {})

  // For each column, collect cards whose state_id is in column.state_ids
  const getColumnCards = (column: BoardColumnRow & { state_ids: string[] }): CardRow[] => {
    const result: CardRow[] = []
    for (const stateId of column.state_ids) {
      const stateCards = cardsByStateId[stateId] ?? []
      result.push(...stateCards)
    }
    return result
  }

  const handleDropCard = (
    cardId: string,
    targetColumn: BoardColumnRow & { state_ids: string[] }
  ) => {
    const card = cards.find((c) => c.card_id === cardId)
    if (!card) return

    const isCrossColumn = !targetColumn.state_ids.includes(card.state_id)

    if (isCrossColumn) {
      // Move to first state in target column
      const newStateId = targetColumn.state_ids[0]
      if (newStateId) {
        onMoveCard(cardId, newStateId)
      }
    } else {
      // Reorder within column — append to end by generating a new sort_order
      const columnCards = getColumnCards(targetColumn)
      const lastCard = columnCards[columnCards.length - 1]
      const newSortOrder =
        lastCard && lastCard.card_id !== cardId
          ? lastCard.sort_order + 'm' // append 'm' to place after last card
          : card.sort_order // no change if already last or only card
      onReorderCard(cardId, newSortOrder)
    }
  }

  const handleAddCard = (columnId: string) => {
    // Stub — wired in Plan 04
    console.log('Add card to column', columnId)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        overflowX: 'auto',
        overflowY: 'visible',
        padding: '4px 0 12px 0',
        alignItems: 'flex-start',
      }}
    >
      {board.columns.map((column) => (
        <KanbanColumn
          key={column.column_id}
          column={column}
          cards={getColumnCards(column)}
          onDropCard={handleDropCard}
          onCardClick={onCardClick}
          onAddCard={handleAddCard}
          newCardIds={newCardIds}
        />
      ))}
    </div>
  )
}
