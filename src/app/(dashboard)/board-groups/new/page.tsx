'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { BoardRow } from '@/types/workflow'

export default function NewBoardGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [boardSearch, setBoardSearch] = useState('')
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set())
  const [boards, setBoards] = useState<BoardRow[]>([])
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/boards')
      .then(r => r.json())
      .then((data: BoardRow[]) => setBoards(data))
      .catch(() => { /* non-blocking */ })
      .finally(() => setBoardsLoading(false))
  }, [])

  const toggleBoard = (id: string) => {
    setSelectedBoardIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredBoards = boards.filter(b => {
    const q = boardSearch.trim().toLowerCase()
    return !q || b.name.toLowerCase().includes(q)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Group name is required.'); return }

    setSaving(true)
    setError(null)

    try {
      // Create group
      const res = await fetch('/api/board-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
      })
      if (!res.ok) {
        const body = await res.json() as { message?: string }
        throw new Error(body.message ?? 'Failed to create group')
      }
      const created = await res.json() as { workflow_id: string }

      // Assign selected boards
      if (selectedBoardIds.size > 0) {
        await Promise.all(
          Array.from(selectedBoardIds).map(bid =>
            fetch(`/api/boards/${bid}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workflow_id: created.workflow_id }),
            })
          )
        )
      }

      router.push(`/board-groups/${created.workflow_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="-m-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-30" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="px-4 pt-2 pb-4 md:px-8 md:pt-3 md:pb-5">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            Create board group
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Groups help agents discover related work across boards.
          </p>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 max-w-2xl">
        <form onSubmit={e => void handleSubmit(e)} className="space-y-6">
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Group name <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Release hardening"
                disabled={saving}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What ties these boards together? What should agents coordinate on?"
                disabled={saving}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {/* Board assignment */}
            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Boards</label>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedBoardIds.size} selected</span>
              </div>
              <input
                type="text"
                value={boardSearch}
                onChange={e => setBoardSearch(e.target.value)}
                placeholder="Search boards…"
                disabled={saving}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <div
                className="max-h-56 overflow-auto rounded-xl"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
              >
                {boardsLoading ? (
                  <div className="flex items-center gap-2 px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading boards…
                  </div>
                ) : filteredBoards.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No boards found.</div>
                ) : (
                  <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filteredBoards.map(board => (
                      <li key={board.board_id} className="px-4 py-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded"
                            checked={selectedBoardIds.has(board.board_id)}
                            onChange={() => toggleBoard(board.board_id)}
                            disabled={saving}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{board.name}</p>
                            {board.description && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{board.description}</p>
                            )}
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Optional. You can change board membership later in group edit.
              </p>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/board-groups')}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Creating…' : 'Create group'}
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              Want to assign boards later? Update each board in{' '}
              <Link href="/boards" className="underline hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Boards</Link>{' '}
              and pick this group.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
