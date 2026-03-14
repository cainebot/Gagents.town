'use client'

import { useState } from 'react'
import { useRealtimeStatus } from '@/components/RealtimeProvider'
import type { TaskRow, TaskStatus, AgentRow } from '@/types/supabase'

// ── Constants ───────────────────────────────────────────────────────────────

const TASK_TYPES = ['general', 'code-review', 'deploy', 'research', 'build', 'test'] as const

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending',     label: 'Pending',     color: '#eab308' },
  { status: 'claimed',     label: 'Claimed',     color: '#3b82f6' },
  { status: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { status: 'completed',   label: 'Done',        color: '#22c55e' },
  { status: 'failed',      label: 'Failed',      color: '#ef4444' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function agentName(agentId: string | null, agents: AgentRow[]): string {
  if (!agentId) return '—'
  const a = agents.find((ag) => ag.agent_id === agentId)
  return a ? `${a.emoji} ${a.name}` : agentId.slice(0, 8) + '…'
}

// ── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TaskRow
  agents: AgentRow[]
  statusColor: string
}

function TaskCard({ task, agents, statusColor }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: 'var(--card, rgba(255,255,255,0.04))',
        borderRadius: '8px',
        borderLeft: `3px solid ${statusColor}`,
        padding: '12px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            color: 'var(--text-primary, #e5e7eb)',
            lineHeight: 1.3,
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {/* Type badge */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-secondary, rgba(255,255,255,0.6))',
              whiteSpace: 'nowrap',
            }}
          >
            {task.type}
          </span>
          {/* Priority badge */}
          {task.priority > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(234,179,8,0.15)',
                color: '#eab308',
                whiteSpace: 'nowrap',
              }}
            >
              P{task.priority}
            </span>
          )}
        </div>
      </div>

      {/* Agent row */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>
          From: <span style={{ color: 'var(--text-primary, #e5e7eb)' }}>{agentName(task.source_agent_id, agents)}</span>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>
          To: <span style={{ color: 'var(--text-primary, #e5e7eb)' }}>{agentName(task.target_agent_id, agents)}</span>
        </span>
      </div>

      {/* Timestamps */}
      <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
          Created {relativeTime(task.created_at)}
        </span>
        {task.claimed_at && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
            Claimed {relativeTime(task.claimed_at)}
          </span>
        )}
        {task.completed_at && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
            Done {relativeTime(task.completed_at)}
          </span>
        )}
      </div>

      {/* Failed: error message */}
      {task.status === 'failed' && task.error_message && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#ef4444',
            background: 'rgba(239,68,68,0.08)',
            borderRadius: '4px',
            padding: '4px 8px',
          }}
        >
          Error: {task.error_message}
          <span style={{ marginLeft: '8px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
            ({task.retry_count}/{task.max_retries} retries)
          </span>
        </div>
      )}

      {/* Expanded: payload + result */}
      {expanded && (
        <div style={{ marginTop: '10px', borderTop: '1px solid var(--border, rgba(255,255,255,0.1))', paddingTop: '10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, rgba(255,255,255,0.5))', marginBottom: '4px' }}>
              Payload
            </div>
            <pre
              style={{
                fontSize: '11px',
                color: 'var(--text-primary, #e5e7eb)',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                padding: '8px',
                overflow: 'auto',
                maxHeight: '160px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(task.payload, null, 2)}
            </pre>
          </div>
          {task.result && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, rgba(255,255,255,0.5))', marginBottom: '4px' }}>
                Result
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  color: '#22c55e',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  padding: '8px',
                  overflow: 'auto',
                  maxHeight: '160px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  label: string
  color: string
  tasks: TaskRow[]
  agents: AgentRow[]
}

function KanbanColumn({ label, color, tasks, agents }: KanbanColumnProps) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            color: 'var(--text-primary, #e5e7eb)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '999px',
            background: `${color}22`,
            color: color,
            flexShrink: 0,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div style={{ overflowY: 'auto', flexGrow: 1, maxHeight: 'calc(100vh - 340px)' }}>
        {tasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 8px',
              color: 'var(--text-secondary, rgba(255,255,255,0.3))',
              fontSize: '12px',
            }}
          >
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.task_id} task={task} agents={agents} statusColor={color} />
          ))
        )}
      </div>
    </div>
  )
}

// ── TaskCreationForm ──────────────────────────────────────────────────────────

interface TaskCreationFormProps {
  agents: AgentRow[]
  onCreated: () => void
}

function TaskCreationForm({ agents, onCreated }: TaskCreationFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('general')
  const [targetAgentId, setTargetAgentId] = useState('')
  const [priority, setPriority] = useState(0)
  const [maxRetries, setMaxRetries] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
        priority,
        max_retries: maxRetries,
      }
      if (targetAgentId) body.target_agent_id = targetAgentId

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      // Clear form
      setTitle('')
      setType('general')
      setTargetAgentId('')
      setPriority(0)
      setMaxRetries(0)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--card, rgba(255,255,255,0.04))',
    border: '1px solid var(--border, rgba(255,255,255,0.12))',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    color: 'var(--text-primary, #e5e7eb)',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary, rgba(255,255,255,0.5))',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <div
      style={{
        background: 'var(--card, rgba(255,255,255,0.04))',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary, #e5e7eb)',
          marginBottom: '14px',
        }}
      >
        Create Task
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 80px 80px auto',
            gap: '12px',
            alignItems: 'end',
          }}
          className="task-form-grid"
        >
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Target agent */}
          <div>
            <label style={labelStyle}>Target agent</label>
            <select
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
            >
              <option value="">(auto-route)</option>
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.emoji} {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>Priority</label>
            <input
              type="number"
              min={0}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Max retries */}
          <div>
            <label style={labelStyle}>Retries</label>
            <input
              type="number"
              min={0}
              max={5}
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                background: submitting ? 'rgba(139,92,246,0.4)' : '#8b5cf6',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: submitting || !title.trim() ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {submitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#ef4444',
              background: 'rgba(239,68,68,0.08)',
              borderRadius: '4px',
              padding: '6px 10px',
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { tasks, agents, tasksLoading } = useRealtimeStatus()
  const [createdCount, setCreatedCount] = useState(0)

  // Group tasks by status, sorted by priority DESC then created_at DESC
  const tasksByStatus = STATUS_COLUMNS.reduce<Record<TaskStatus, TaskRow[]>>(
    (acc, col) => {
      acc[col.status] = tasks
        .filter((t) => t.status === col.status)
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      return acc
    },
    {} as Record<TaskStatus, TaskRow[]>
  )

  return (
    <div style={{ maxWidth: '1600px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary, #e5e7eb)',
          }}
        >
          Tasks
        </h1>
        {!tasksLoading && (
          <span
            style={{
              fontSize: '13px',
              padding: '3px 10px',
              background: 'var(--border, rgba(255,255,255,0.08))',
              borderRadius: '999px',
              color: 'var(--text-secondary, rgba(255,255,255,0.5))',
            }}
          >
            {tasks.length} total
          </span>
        )}
      </div>

      {/* Task creation form */}
      <TaskCreationForm
        agents={agents}
        onCreated={() => setCreatedCount((n) => n + 1)}
        key={createdCount}
      />

      {/* Kanban board */}
      {tasksLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}
        >
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.status}
              style={{
                height: '300px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: '10px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}
          className="kanban-grid"
        >
          {STATUS_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              label={col.label}
              color={col.color}
              tasks={tasksByStatus[col.status]}
              agents={agents}
            />
          ))}
        </div>
      )}

      {/* Responsive style */}
      <style>{`
        @media (max-width: 1200px) {
          .kanban-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .kanban-grid {
            grid-template-columns: 1fr !important;
          }
          .task-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
