'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CardRow, CardType, Priority, SavedFilterRow } from '@/types/workflow'

interface BoardFilterBarProps {
  boardId: string
  cards: CardRow[]
  agents: string[]
  onFilterChange: (filtered: CardRow[]) => void
}

interface ActiveFilters {
  search: string
  card_types: CardType[]
  priorities: Priority[]
  assignees: string[]
  labels: string[]
}

const EMPTY_FILTERS: ActiveFilters = {
  search: '',
  card_types: [],
  priorities: [],
  assignees: [],
  labels: [],
}

type FilterDropdownKey = 'type' | 'priority' | 'assignee' | 'labels' | null

function hasActiveFilters(f: ActiveFilters): boolean {
  return (
    f.search.trim().length > 0 ||
    f.card_types.length > 0 ||
    f.priorities.length > 0 ||
    f.assignees.length > 0 ||
    f.labels.length > 0
  )
}

function applyFilters(cards: CardRow[], filters: ActiveFilters): CardRow[] {
  return cards.filter((card) => {
    // Text search — AND with category filters
    if (filters.search.trim()) {
      const needle = filters.search.toLowerCase()
      const titleMatch = card.title.toLowerCase().includes(needle)
      const descMatch = card.description?.toLowerCase().includes(needle) ?? false
      if (!titleMatch && !descMatch) return false
    }

    // Card type — OR within, AND with others
    if (filters.card_types.length > 0 && !filters.card_types.includes(card.card_type)) {
      return false
    }

    // Priority — OR within
    if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) {
      return false
    }

    // Assignee — OR within (special 'unassigned' value)
    if (filters.assignees.length > 0) {
      const cardAssignee = card.assigned_agent_id
      const matchesUnassigned = filters.assignees.includes('unassigned') && cardAssignee === null
      const matchesAgent = cardAssignee !== null && filters.assignees.includes(cardAssignee)
      if (!matchesUnassigned && !matchesAgent) return false
    }

    // Labels — OR within
    if (filters.labels.length > 0) {
      const hasLabel = filters.labels.some((l) => card.labels.includes(l))
      if (!hasLabel) return false
    }

    return true
  })
}

interface FilterChipDropdownProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  onClose: () => void
}

function FilterChipDropdown({ label: _label, options, selected, onToggle, onClose }: FilterChipDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 50,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        minWidth: '160px',
        maxHeight: '240px',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border)',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLLabelElement).style.background =
              'var(--surface-alt, rgba(255,255,255,0.05))'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLLabelElement).style.background = 'transparent'
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)}
            style={{ accentColor: 'var(--accent, #6366f1)' }}
          />
          {opt.label}
        </label>
      ))}
      {options.length === 0 && (
        <div
          style={{
            padding: '10px 12px',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          No options available
        </div>
      )}
    </div>
  )
}

export function BoardFilterBar({ boardId, cards, agents, onFilterChange }: BoardFilterBarProps) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [openDropdown, setOpenDropdown] = useState<FilterDropdownKey>(null)
  const [savedFilters, setSavedFilters] = useState<SavedFilterRow[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSavedFiltersDropdown, setShowSavedFiltersDropdown] = useState(false)
  const savedFiltersRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch saved filters on mount
  useEffect(() => {
    fetch(`/api/boards/${boardId}/filters`)
      .then((res) => res.json())
      .then((data: SavedFilterRow[]) => setSavedFilters(data))
      .catch(() => {})
  }, [boardId])

  // Apply filters whenever cards or filters change
  useEffect(() => {
    onFilterChange(applyFilters(cards, filters))
  }, [cards, filters, onFilterChange])

  // Close saved filters dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (savedFiltersRef.current && !savedFiltersRef.current.contains(e.target as Node)) {
        setShowSavedFiltersDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }))
    }, 300)
  }

  const toggleValue = useCallback(<T extends string>(key: keyof ActiveFilters, value: T) => {
    setFilters((prev) => {
      const arr = prev[key] as T[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }, [])

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setOpenDropdown(null)
  }

  const handleSaveFilter = async () => {
    const name = saveFilterName.trim()
    if (!name) return

    try {
      const res = await fetch(`/api/boards/${boardId}/filters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: filters }),
      })
      if (res.ok) {
        const saved = (await res.json()) as SavedFilterRow
        setSavedFilters((prev) => [...prev, saved])
        setSaveFilterName('')
        setShowSaveInput(false)
      }
    } catch {
      // non-critical
    }
  }

  const handleLoadFilter = (saved: SavedFilterRow) => {
    const config = saved.config as Partial<ActiveFilters>
    setFilters({
      search: config.search ?? '',
      card_types: config.card_types ?? [],
      priorities: config.priorities ?? [],
      assignees: config.assignees ?? [],
      labels: config.labels ?? [],
    })
    setShowSavedFiltersDropdown(false)
  }

  const handleDeleteSavedFilter = async (filterId: string) => {
    try {
      await fetch(`/api/boards/${boardId}/filters/${filterId}`, { method: 'DELETE' })
      setSavedFilters((prev) => prev.filter((f) => f.filter_id !== filterId))
    } catch {
      // non-critical
    }
  }

  const isActive = hasActiveFilters(filters)

  // Build available options from cards
  const availableCardTypes: { value: string; label: string }[] = [
    { value: 'epic', label: 'Epic' },
    { value: 'story', label: 'Story' },
    { value: 'task', label: 'Task' },
    { value: 'subtask', label: 'Subtask' },
    { value: 'bug', label: 'Bug' },
  ]

  const availablePriorities: { value: string; label: string }[] = [
    { value: 'baja', label: 'Low' },
    { value: 'media', label: 'Medium' },
    { value: 'alta', label: 'High' },
  ]

  const allAssignees = Array.from(
    new Set([
      ...agents,
      ...cards.filter((c) => c.assigned_agent_id).map((c) => c.assigned_agent_id as string),
    ])
  )
  const availableAssignees: { value: string; label: string }[] = [
    { value: 'unassigned', label: 'Unassigned' },
    ...allAssignees.map((a) => ({ value: a, label: a })),
  ]

  const allLabels = Array.from(new Set(cards.flatMap((c) => c.labels)))
  const availableLabels: { value: string; label: string }[] = allLabels.map((l) => ({
    value: l,
    label: l,
  }))

  const activeCount = [
    filters.card_types.length,
    filters.priorities.length,
    filters.assignees.length,
    filters.labels.length,
    filters.search.trim().length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    background: active ? 'var(--accent, #6366f1)' : 'var(--surface)',
    color: active ? 'white' : 'var(--text-secondary)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 0.1s ease, color 0.1s ease',
  })

  return (
    <div
      style={{
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 4px',
        background: 'var(--surface-elevated, var(--surface))',
        borderBottom: '1px solid var(--border)',
        marginBottom: '8px',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Text search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '3px 8px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>&#128269;</span>
        <input
          type="text"
          placeholder="Search cards..."
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            width: '140px',
          }}
        />
      </div>

      {/* Type chip */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={chipStyle(filters.card_types.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
        >
          Type
          {filters.card_types.length > 0 && (
            <>
              <span>: {filters.card_types.join(', ')}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setFilters((prev) => ({ ...prev, card_types: [] }))
                }}
                style={{ marginLeft: '2px', opacity: 0.8, fontWeight: 600 }}
              >
                &#10005;
              </span>
            </>
          )}
        </div>
        {openDropdown === 'type' && (
          <FilterChipDropdown
            label="Type"
            options={availableCardTypes}
            selected={filters.card_types}
            onToggle={(v) => toggleValue('card_types', v as CardType)}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>

      {/* Priority chip */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={chipStyle(filters.priorities.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
        >
          Priority
          {filters.priorities.length > 0 && (
            <>
              <span>: {filters.priorities.join(', ')}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setFilters((prev) => ({ ...prev, priorities: [] }))
                }}
                style={{ marginLeft: '2px', opacity: 0.8, fontWeight: 600 }}
              >
                &#10005;
              </span>
            </>
          )}
        </div>
        {openDropdown === 'priority' && (
          <FilterChipDropdown
            label="Priority"
            options={availablePriorities}
            selected={filters.priorities}
            onToggle={(v) => toggleValue('priorities', v as Priority)}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>

      {/* Assignee chip */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={chipStyle(filters.assignees.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
        >
          Assignee
          {filters.assignees.length > 0 && (
            <>
              <span>: {filters.assignees.join(', ')}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setFilters((prev) => ({ ...prev, assignees: [] }))
                }}
                style={{ marginLeft: '2px', opacity: 0.8, fontWeight: 600 }}
              >
                &#10005;
              </span>
            </>
          )}
        </div>
        {openDropdown === 'assignee' && (
          <FilterChipDropdown
            label="Assignee"
            options={availableAssignees}
            selected={filters.assignees}
            onToggle={(v) => toggleValue('assignees', v)}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>

      {/* Labels chip */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={chipStyle(filters.labels.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'labels' ? null : 'labels')}
        >
          Labels
          {filters.labels.length > 0 && (
            <>
              <span>: {filters.labels.join(', ')}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setFilters((prev) => ({ ...prev, labels: [] }))
                }}
                style={{ marginLeft: '2px', opacity: 0.8, fontWeight: 600 }}
              >
                &#10005;
              </span>
            </>
          )}
        </div>
        {openDropdown === 'labels' && (
          <FilterChipDropdown
            label="Labels"
            options={availableLabels}
            selected={filters.labels}
            onToggle={(v) => toggleValue('labels', v)}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>

      {/* Active filter summary */}
      {isActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            marginLeft: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            {activeCount} active
          </span>
          <button
            onClick={clearFilters}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save filter button */}
      {isActive && !showSaveInput && (
        <button
          onClick={() => setShowSaveInput(true)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            padding: '3px 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Save filter
        </button>
      )}

      {/* Save filter input */}
      {showSaveInput && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
        >
          <input
            type="text"
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSaveFilter()
              if (e.key === 'Escape') {
                setShowSaveInput(false)
                setSaveFilterName('')
              }
            }}
            placeholder="Filter name..."
            autoFocus
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--accent, #6366f1)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              padding: '3px 8px',
              width: '120px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => void handleSaveFilter()}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              background: 'var(--accent, #6366f1)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false)
              setSaveFilterName('')
            }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Saved filters dropdown */}
      {savedFilters.length > 0 && (
        <div ref={savedFiltersRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowSavedFiltersDropdown((v) => !v)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            Saved ({savedFilters.length})
          </button>
          {showSavedFiltersDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                zIndex: 50,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                minWidth: '180px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {savedFilters.map((sf) => (
                <div
                  key={sf.filter_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 12px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    onClick={() => handleLoadFilter(sf)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLSpanElement).style.color = 'var(--accent, #6366f1)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLSpanElement).style.color = 'var(--text-primary)'
                    }}
                  >
                    {sf.name}
                  </span>
                  <button
                    onClick={() => void handleDeleteSavedFilter(sf.filter_id)}
                    title="Delete saved filter"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      padding: '0 2px',
                      opacity: 0.6,
                    }}
                  >
                    &#10005;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
