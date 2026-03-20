'use client'

import { useState, useRef, useEffect } from 'react'
import type { CardRow, CardType } from '@/types/workflow'

interface InlineCardCreateProps {
  workflowId: string
  stateId: string
  defaultCardType: CardType
  onCardCreated: (card: CardRow) => void
  onCancel: () => void
}

export function InlineCardCreate({
  workflowId,
  stateId,
  defaultCardType,
  onCardCreated,
  onCancel,
}: InlineCardCreateProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          workflow_id: workflowId,
          state_id: stateId,
          card_type: defaultCardType,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Failed to create card (${res.status})`)
      }

      const newCard = (await res.json()) as CardRow
      onCardCreated(newCard)
      setTitle('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-1 px-2 py-1.5 bg-secondary border border-brand-600 rounded-[6px] flex flex-col gap-1">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title..."
        disabled={isSubmitting}
        className="bg-transparent border-none outline-none font-body text-[13px] text-primary w-full py-0.5 px-0"
      />
      {error && (
        <span className="font-body text-[11px] text-error-600">
          {error}
        </span>
      )}
      <div className="flex gap-1.5 items-center mt-0.5">
        <span className="font-body text-[11px] text-tertiary opacity-60">
          Enter to create · Esc to cancel
        </span>
      </div>
    </div>
  )
}
