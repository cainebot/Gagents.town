'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  CardRow,
  CardType,
  Priority,
  SavedFilterRow,
  CustomFieldDefinitionRow,
  CardCustomFieldValueRow,
} from '@/types/workflow'

// ─── Props ────────────────────────────────────────────────────────────────────

interface BoardFilterBarProps {
  boardId: string
  cards: CardRow[]
  agents: string[]
  onFilterChange: (filtered: CardRow[]) => void
  fieldDefinitions?: CustomFieldDefinitionRow[]
  cardFieldValues?: Record<string, CardCustomFieldValueRow[]>
}

// ─── Filter state ──────────────────────────────────────────────────────────────

interface ActiveFilters {
  search: string
  card_types: CardType[]
  priorities: Priority[]
  assignees: string[]
  labels: string[]
  custom_fields: Record<string, string[]> // field_id -> selected values
}

const EMPTY_FILTERS: ActiveFilters = {
  search: '',
  card_types: [],
  priorities: [],
  assignees: [],
  labels: [],
  custom_fields: {},
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasActiveFilters(f: ActiveFilters): boolean {
  return (
    f.search.trim().length > 0 ||
    f.card_types.length > 0 ||
    f.priorities.length > 0 ||
    f.assignees.length > 0 ||
    f.labels.length > 0 ||
    Object.values(f.custom_fields).some((arr) => arr.length > 0)
  )
}

function countActiveFilters(f: ActiveFilters): number {
  const custom = Object.values(f.custom_fields).filter((arr) => arr.length > 0).length
  return (
    (f.search.trim().length > 0 ? 1 : 0) +
    (f.card_types.length > 0 ? 1 : 0) +
    (f.priorities.length > 0 ? 1 : 0) +
    (f.assignees.length > 0 ? 1 : 0) +
    (f.labels.length > 0 ? 1 : 0) +
    custom
  )
}

function applyFilters(
  cards: CardRow[],
  filters: ActiveFilters,
  cardFieldValues?: Record<string, CardCustomFieldValueRow[]>
): CardRow[] {
  return cards.filter((card) => {
    // Text search — AND with all other filters
    if (filters.search.trim()) {
      const needle = filters.search.toLowerCase()
      const titleMatch = card.title.toLowerCase().includes(needle)
      const descMatch = card.description?.toLowerCase().includes(needle) ?? false
      if (!titleMatch && !descMatch) return false
    }

    // Card type — OR within
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

    // Custom fields — AND across fields, OR within each field's values
    if (cardFieldValues) {
      const cardValues = cardFieldValues[card.card_id] ?? []
      for (const [fieldId, selectedValues] of Object.entries(filters.custom_fields)) {
        if (selectedValues.length === 0) continue
        const fieldValue = cardValues.find((v) => v.field_id === fieldId)
        if (!fieldValue) return false
        const rawValue = fieldValue.value
        // Support checkbox (boolean stored as bool), select (string), multi_select (string[])
        let matches = false
        if (Array.isArray(rawValue)) {
          // multi_select: check if any selected value is in array
          matches = selectedValues.some((sv) => (rawValue as string[]).includes(sv))
        } else if (typeof rawValue === 'boolean') {
          // checkbox: 'true'/'false' string comparison
          matches = selectedValues.includes(String(rawValue))
        } else {
          // select: string comparison
          matches = selectedValues.includes(String(rawValue))
        }
        if (!matches) return false
      }
    }

    return true
  })
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '8px 12px 4px 12px',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
      }}
    >
      {label}
    </div>
  )
}

// ─── Checkbox option row ───────────────────────────────────────────────────────

function CheckboxOption({
  value,
  label,
  checked,
  onToggle,
}: {
  value: string
  label: string
  checked: boolean
  onToggle: (value: string) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 12px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--text-primary)',
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
        checked={checked}
        onChange={() => onToggle(value)}
        style={{ accentColor: 'var(--accent, #6366f1)' }}
      />
      {label}
    </label>
  )
}

// ─── Filter dropdown panel ────────────────────────────────────────────────────

interface FilterDropdownProps {
  cards: CardRow[]
  agents: string[]
  filters: ActiveFilters
  fieldDefinitions?: CustomFieldDefinitionRow[]
  onToggleCardType: (value: CardType) => void
  onTogglePriority: (value: Priority) => void
  onToggleAssignee: (value: string) => void
  onToggleLabel: (value: string) => void
  onToggleCustomField: (fieldId: string, value: string) => void
  onClose: () => void
}

function FilterDropdown({
  cards,
  agents,
  filters,
  fieldDefinitions,
  onToggleCardType,
  onTogglePriority,
  onToggleAssignee,
  onToggleLabel,
  onToggleCustomField,
  onClose,
}: FilterDropdownProps) {
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

  // Derive available options
  const allAssignees = Array.from(
    new Set([
      ...agents,
      ...cards.filter((c) => c.assigned_agent_id).map((c) => c.assigned_agent_id as string),
    ])
  )
  const allLabels = Array.from(new Set(cards.flatMap((c) => c.labels)))

  // Only show filterable custom fields: select, multi_select, checkbox
  const filterableFields =
    fieldDefinitions?.filter((fd) =>
      ['select', 'multi_select', 'checkbox'].includes(fd.field_type)
    ) ?? []

  const divider = (
    <div
      style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}
    />
  )

  const cardTypeOptions: { value: CardType; label: string }[] = [
    { value: 'epic', label: 'Epic' },
    { value: 'story', label: 'Story' },
    { value: 'task', label: 'Task' },
    { value: 'subtask', label: 'Subtask' },
    { value: 'bug', label: 'Bug' },
  ]

  const priorityOptions: { value: Priority; label: string }[] = [
    { value: 'baja', label: 'Low' },
    { value: 'media', label: 'Medium' },
    { value: 'alta', label: 'High' },
  ]

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 100,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        minWidth: '220px',
        maxHeight: '420px',
        overflowY: 'auto',
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Type section */}
      <SectionHeader label="Type" />
      {cardTypeOptions.map((opt) => (
        <CheckboxOption
          key={opt.value}
          value={opt.value}
          label={opt.label}
          checked={filters.card_types.includes(opt.value)}
          onToggle={(v) => onToggleCardType(v as CardType)}
        />
      ))}

      {divider}

      {/* Priority section */}
      <SectionHeader label="Priority" />
      {priorityOptions.map((opt) => (
        <CheckboxOption
          key={opt.value}
          value={opt.value}
          label={opt.label}
          checked={filters.priorities.includes(opt.value)}
          onToggle={(v) => onTogglePriority(v as Priority)}
        />
      ))}

      {divider}

      {/* Assignee section */}
      <SectionHeader label="Assignee" />
      <CheckboxOption
        value="unassigned"
        label="Unassigned"
        checked={filters.assignees.includes('unassigned')}
        onToggle={(v) => onToggleAssignee(v)}
      />
      {allAssignees.map((a) => (
        <CheckboxOption
          key={a}
          value={a}
          label={a}
          checked={filters.assignees.includes(a)}
          onToggle={(v) => onToggleAssignee(v)}
        />
      ))}
      {allAssignees.length === 0 && (
        <div
          style={{
            padding: '5px 12px',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}
        >
          No assignees
        </div>
      )}

      {/* Labels section — only if labels exist */}
      {allLabels.length > 0 && (
        <>
          {divider}
          <SectionHeader label="Labels" />
          {allLabels.map((l) => (
            <CheckboxOption
              key={l}
              value={l}
              label={l}
              checked={filters.labels.includes(l)}
              onToggle={(v) => onToggleLabel(v)}
            />
          ))}
        </>
      )}

      {/* Custom fields section — only if filterable fields exist */}
      {filterableFields.length > 0 && (
        <>
          {divider}
          <SectionHeader label="Custom Fields" />
          {filterableFields.map((fd) => {
            const selectedForField = filters.custom_fields[fd.field_id] ?? []
            if (fd.field_type === 'checkbox') {
              return (
                <div key={fd.field_id}>
                  <div
                    style={{
                      padding: '4px 12px 2px 12px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}
                  >
                    {fd.name}
                  </div>
                  <CheckboxOption
                    value="true"
                    label="Checked"
                    checked={selectedForField.includes('true')}
                    onToggle={(v) => onToggleCustomField(fd.field_id, v)}
                  />
                  <CheckboxOption
                    value="false"
                    label="Unchecked"
                    checked={selectedForField.includes('false')}
                    onToggle={(v) => onToggleCustomField(fd.field_id, v)}
                  />
                </div>
              )
            }
            // select / multi_select
            const options = fd.options ?? []
            if (options.length === 0) return null
            return (
              <div key={fd.field_id}>
                <div
                  style={{
                    padding: '4px 12px 2px 12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  {fd.name}
                </div>
                {options.map((opt) => (
                  <CheckboxOption
                    key={opt}
                    value={opt}
                    label={opt}
                    checked={selectedForField.includes(opt)}
                    onToggle={(v) => onToggleCustomField(fd.field_id, v)}
                  />
                ))}
              </div>
            )
          })}
        </>
      )}

      {/* Bottom padding */}
      <div style={{ height: '6px' }} />
    </div>
  )
}

// ─── Active filter chip ────────────────────────────────────────────────────────

function ActiveFilterChip({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px 2px 10px',
        borderRadius: '999px',
        background: 'var(--accent, #6366f1)',
        color: 'white',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
      <button
        onClick={onClear}
        title={`Clear ${label}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '10px',
          padding: '0 1px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        &#10005;
      </button>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BoardFilterBar({
  boardId,
  cards,
  agents,
  onFilterChange,
  fieldDefinitions,
  cardFieldValues,
}: BoardFilterBarProps) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const filterButtonRef = useRef<HTMLDivElement>(null)

  const [savedFilters, setSavedFilters] = useState<SavedFilterRow[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSavedFiltersDropdown, setShowSavedFiltersDropdown] = useState(false)
  const savedFiltersRef = useRef<HTMLDivElement>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch saved filters on mount
  useEffect(() => {
    fetch(`/api/boards/${boardId}/filters`)
      .then((res) => res.json())
      .then((data: SavedFilterRow[]) => setSavedFilters(data))
      .catch(() => {})
  }, [boardId])

  // Apply filters whenever cards, filters, or field values change
  useEffect(() => {
    onFilterChange(applyFilters(cards, filters, cardFieldValues))
  }, [cards, filters, cardFieldValues, onFilterChange])

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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }))
    }, 300)
  }

  const toggleCardType = useCallback((value: CardType) => {
    setFilters((prev) => ({
      ...prev,
      card_types: prev.card_types.includes(value)
        ? prev.card_types.filter((v) => v !== value)
        : [...prev.card_types, value],
    }))
  }, [])

  const togglePriority = useCallback((value: Priority) => {
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(value)
        ? prev.priorities.filter((v) => v !== value)
        : [...prev.priorities, value],
    }))
  }, [])

  const toggleAssignee = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(value)
        ? prev.assignees.filter((v) => v !== value)
        : [...prev.assignees, value],
    }))
  }, [])

  const toggleLabel = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      labels: prev.labels.includes(value)
        ? prev.labels.filter((v) => v !== value)
        : [...prev.labels, value],
    }))
  }, [])

  const toggleCustomField = useCallback((fieldId: string, value: string) => {
    setFilters((prev) => {
      const current = prev.custom_fields[fieldId] ?? []
      return {
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [fieldId]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        },
      }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setShowFilterDropdown(false)
    if (searchInputRef.current) searchInputRef.current.value = ''
  }, [])

  const clearCategory = useCallback(
    (key: keyof Omit<ActiveFilters, 'custom_fields' | 'search'>) => {
      setFilters((prev) => ({ ...prev, [key]: [] }))
    },
    []
  )

  const clearCustomField = useCallback((fieldId: string) => {
    setFilters((prev) => {
      const next = { ...prev.custom_fields }
      delete next[fieldId]
      return { ...prev, custom_fields: next }
    })
  }, [])

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
      custom_fields: config.custom_fields ?? {},
    })
    if (searchInputRef.current) {
      searchInputRef.current.value = config.search ?? ''
    }
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

  // ── Derived state ────────────────────────────────────────────────────────────

  const isActive = hasActiveFilters(filters)
  const activeCount = countActiveFilters(filters)

  // Build active filter chips for non-search categories
  const activeChips: { key: string; label: string; onClear: () => void }[] = []

  if (filters.card_types.length > 0) {
    activeChips.push({
      key: 'card_types',
      label: `Type: ${filters.card_types.join(', ')}`,
      onClear: () => clearCategory('card_types'),
    })
  }
  if (filters.priorities.length > 0) {
    const labelMap: Record<string, string> = { baja: 'Low', media: 'Medium', alta: 'High' }
    activeChips.push({
      key: 'priorities',
      label: `Priority: ${filters.priorities.map((p) => labelMap[p] ?? p).join(', ')}`,
      onClear: () => clearCategory('priorities'),
    })
  }
  if (filters.assignees.length > 0) {
    activeChips.push({
      key: 'assignees',
      label: `Assignee: ${filters.assignees.join(', ')}`,
      onClear: () => clearCategory('assignees'),
    })
  }
  if (filters.labels.length > 0) {
    activeChips.push({
      key: 'labels',
      label: `Labels: ${filters.labels.join(', ')}`,
      onClear: () => clearCategory('labels'),
    })
  }
  // Custom field chips
  for (const [fieldId, values] of Object.entries(filters.custom_fields)) {
    if (values.length === 0) continue
    const fieldDef = fieldDefinitions?.find((fd) => fd.field_id === fieldId)
    const fieldName = fieldDef?.name ?? fieldId
    activeChips.push({
      key: `cf_${fieldId}`,
      label: `${fieldName}: ${values.join(', ')}`,
      onClear: () => clearCustomField(fieldId),
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 4px',
        background: 'var(--surface-elevated, var(--surface))',
        borderBottom: '1px solid var(--border)',
        marginBottom: '8px',
        flexShrink: 0,
        minHeight: '40px',
        flexWrap: 'wrap',
        rowGap: '4px',
      }}
    >
      {/* Search input */}
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
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={searchInputRef}
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

      {/* Unified Filter button + dropdown */}
      <div ref={filterButtonRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowFilterDropdown((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: isActive ? 'var(--accent, #6366f1)' : 'var(--surface)',
            color: isActive ? 'white' : 'var(--text-secondary)',
            transition: 'background 0.1s ease, color 0.1s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'var(--surface-alt, rgba(255,255,255,0.06))'
              el.style.color = 'var(--text-primary)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'var(--surface)'
              el.style.color = 'var(--text-secondary)'
            }
          }}
        >
          {/* Funnel icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>

        {showFilterDropdown && (
          <FilterDropdown
            cards={cards}
            agents={agents}
            filters={filters}
            fieldDefinitions={fieldDefinitions}
            onToggleCardType={toggleCardType}
            onTogglePriority={togglePriority}
            onToggleAssignee={toggleAssignee}
            onToggleLabel={toggleLabel}
            onToggleCustomField={toggleCustomField}
            onClose={() => setShowFilterDropdown(false)}
          />
        )}
      </div>

      {/* Active filter summary chips */}
      {activeChips.map((chip) => (
        <ActiveFilterChip key={chip.key} label={chip.label} onClear={chip.onClear} />
      ))}

      {/* Clear all — only when filters active */}
      {isActive && (
        <button
          onClick={clearFilters}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            padding: '2px 7px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Clear all
        </button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
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
