'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Send } from 'lucide-react'
import { StatusDot } from '@/components/atoms/StatusDot'
import { PriorityBadge } from '@/components/atoms/PriorityBadge'
import type { AgentListItem } from '@/contexts/AgentFilterContext'
import type { CardRow, CursorPage } from '@/types/workflow'

// ---- Helper ----

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}

// ---- Types ----

interface ActivityItem {
  action: string
  created_at: string
}

interface ChatMessage {
  text: string
  sender: 'user'
  ts: Date
}

// ---- Section label style (reused across all sections) ----

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: 'var(--text-muted)',
  marginBottom: '8px',
}

// ---- Props ----

interface AgentSidePanelProps {
  agent: AgentListItem
  boardId: string
  onClose: () => void
}

// ---- Component ----

export function AgentSidePanel({ agent, boardId, onClose }: AgentSidePanelProps) {
  // Panel slide CSS — always visible when rendered (parent controls mount)
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: 0,
    top: '48px',
    bottom: 0,
    width: '360px',
    background: 'var(--surface-elevated, #242424)',
    borderLeft: '1px solid var(--border)',
    zIndex: 49,
    transform: 'translateX(0)',
    transition: 'transform 0.2s ease-out',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  }

  // ---- Section 2: Soul Description ----
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(agent.about ?? '')
  const [descSaving, setDescSaving] = useState(false)
  const [descError, setDescError] = useState<string | null>(null)

  // Reset draft when agent changes
  useEffect(() => {
    setDescDraft(agent.about ?? '')
    setIsEditingDesc(false)
    setDescError(null)
  }, [agent.agent_id, agent.about])

  const handleDescSave = useCallback(async () => {
    setDescSaving(true)
    try {
      const res = await fetch(`/api/agents/${agent.agent_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: descDraft }),
      })
      if (!res.ok) throw new Error('Save failed')
      setIsEditingDesc(false)
      setDescError(null)
    } catch {
      setDescError('No se pudo guardar.')
      setTimeout(() => setDescError(null), 3000)
    } finally {
      setDescSaving(false)
    }
  }, [agent.agent_id, descDraft])

  // ---- Section 3: Assigned Cards ----
  const [assignedCards, setAssignedCards] = useState<CardRow[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    setCardsLoading(true)
    fetch(`/api/cards?assigned_agent_id=${agent.agent_id}&board_id=${boardId}`)
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((page: CursorPage<CardRow>) => setAssignedCards(page.data ?? []))
      .catch(() => setAssignedCards([]))
      .finally(() => setCardsLoading(false))
  }, [agent.agent_id, boardId])

  // ---- Section 4: Recent Activity ----
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    fetch(`/api/activities?actor=${agent.agent_id}&limit=5`)
      .then((r) => r.ok ? r.json() : [])
      .then((items: ActivityItem[]) => setActivities(Array.isArray(items) ? items.slice(0, 5) : []))
      .catch(() => setActivities([]))
  }, [agent.agent_id])

  // ---- Section 5: Chat ----
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const handleSend = () => {
    if (!chatMsg.trim()) return
    setMessages((prev) => [...prev, { text: chatMsg, sender: 'user', ts: new Date() }])
    setChatMsg('')
  }

  // ---- Render ----

  return (
    <div style={panelStyle} role="complementary" aria-label={`Panel de ${agent.name}`}>

      {/* Section 1 — Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        {/* Avatar */}
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--surface)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            fontFamily: 'var(--font-body)',
          }}
          aria-hidden="true"
        >
          {agent.emoji || agent.name.charAt(0).toUpperCase()}
        </span>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.2,
              }}
            >
              {agent.name}
            </span>
            {agent.badge === 'LEAD' && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(255,59,48,0.10)',
                  color: 'var(--accent)',
                  borderRadius: '9999px',
                  padding: '2px 6px',
                  letterSpacing: '0.8px',
                }}
              >
                Lead
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <StatusDot status={agent.status} variant="agent" />
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {agent.status}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            borderRadius: '4px',
            flexShrink: 0,
          }}
          aria-label="Cerrar panel"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Section 2 — Soul Description */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={sectionLabelStyle}>DESCRIPCIÓN</div>

        {/* Unsaved indicator */}
        {isEditingDesc && (
          <span
            aria-label="Cambios sin guardar"
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--warning)',
              marginBottom: '6px',
            }}
          />
        )}

        {isEditingDesc ? (
          <textarea
            autoFocus
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={handleDescSave}
            disabled={descSaving}
            rows={4}
            style={{
              width: '100%',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              background: 'transparent',
              border: '1px solid var(--accent)',
              borderRadius: '4px',
              padding: '6px 8px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditingDesc(true)}
            style={{
              fontSize: '13px',
              color: descDraft ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontStyle: descDraft ? 'normal' : 'italic',
              lineHeight: 1.5,
              cursor: 'text',
              minHeight: '24px',
            }}
          >
            {descDraft || 'Sin descripción.'}
          </div>
        )}

        {descError && (
          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color: 'var(--negative)',
            }}
          >
            {descError}
          </div>
        )}
      </div>

      {/* Section 3 — Assigned Cards */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={sectionLabelStyle}>TARJETAS ASIGNADAS</div>

        {cardsLoading ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Cargando…
          </div>
        ) : assignedCards.length === 0 ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Sin tarjetas asignadas en este tablero.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {assignedCards.map((card) => (
              <div
                key={card.card_id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PriorityBadge priority={card.priority} size="sm" />
                {card.code && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {card.code}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {card.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4 — Recent Activity */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          flex: 1,
        }}
      >
        <div style={sectionLabelStyle}>ACTIVIDAD RECIENTE</div>

        {activities.length === 0 ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Sin actividad reciente.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activities.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {item.action}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {relativeTime(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5 — Chat Input (sticky bottom) */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-elevated, #242424)',
          padding: '12px 16px',
          flexShrink: 0,
        }}
      >
        {/* Chat message history (local only) */}
        {messages.length > 0 && (
          <div
            style={{
              marginBottom: '8px',
              maxHeight: '120px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                }}
              >
                {m.text}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            placeholder="Escribe un mensaje…"
            rows={1}
            style={{
              flex: 1,
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              minHeight: '36px',
              maxHeight: '100px',
              resize: 'none',
              color: 'var(--text-primary)',
              padding: '8px 10px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              // Enter without Shift sends
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!chatMsg.trim()}
            aria-label="Enviar mensaje"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: chatMsg.trim() ? 'pointer' : 'not-allowed',
              color: chatMsg.trim() ? 'var(--accent)' : 'var(--text-muted)',
              opacity: chatMsg.trim() ? 1 : 0.4,
              flexShrink: 0,
              borderRadius: '6px',
              padding: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
