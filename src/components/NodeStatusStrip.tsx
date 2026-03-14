'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeStatus } from '@/components/RealtimeProvider'
import type { NodeRow, NodeStatus } from '@/types/supabase'

// ---------- Notification types ----------

interface NodeNotification {
  id: number
  nodeId: string
  message: string
  type: 'offline' | 'online'
}

let notifCounter = 0

function getRamPercent(node: NodeRow): number {
  if (!node.ram_total_mb || node.ram_total_mb === 0) return 0
  return Math.round((node.ram_usage_mb / node.ram_total_mb) * 100)
}

function getRamBarColor(percent: number): string {
  if (percent > 85) return 'var(--error, #FF453A)'
  if (percent > 70) return 'var(--warning, #FFD60A)'
  return 'var(--success, #32D74B)'
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === 'online') {
    return (
      <span style={{ color: 'var(--success, #32D74B)', fontSize: '10px', fontWeight: 700 }}>
        ✓
      </span>
    )
  }
  if (status === 'degraded') {
    return (
      <span style={{ color: 'var(--warning, #FFD60A)', fontSize: '10px', fontWeight: 700 }}>
        ⚠
      </span>
    )
  }
  return (
    <span style={{ color: 'var(--error, #FF453A)', fontSize: '10px', fontWeight: 700 }}>
      ✕
    </span>
  )
}

function statusDotColor(status: NodeStatus): string {
  if (status === 'online') return 'var(--success, #32D74B)'
  if (status === 'degraded') return 'var(--warning, #FFD60A)'
  return 'var(--error, #FF453A)'
}

function NodeCard({ node }: { node: NodeRow }) {
  const ramPercent = getRamPercent(node)
  const barColor = getRamBarColor(ramPercent)
  const shortId = node.node_id.length > 12 ? node.node_id.slice(0, 12) + '…' : node.node_id

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px 10px',
        background: 'var(--card, rgba(255,255,255,0.05))',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '6px',
        minWidth: '120px',
        flexShrink: 0,
      }}
    >
      {/* Node ID + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusDotColor(node.status),
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <StatusIcon status={node.status} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-primary, #ffffff)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={node.node_id}
        >
          {shortId}
        </span>
      </div>

      {/* RAM bar */}
      <div
        style={{
          width: '100%',
          height: '3px',
          background: 'var(--border, rgba(255,255,255,0.15))',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${ramPercent}%`,
            height: '100%',
            background: barColor,
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Agent count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>
          {ramPercent}% RAM
        </span>
        <span
          style={{
            fontSize: '10px',
            background: 'var(--border, rgba(255,255,255,0.1))',
            borderRadius: '4px',
            padding: '1px 5px',
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          {node.agent_count} agent{node.agent_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        padding: '6px 10px',
        background: 'var(--card, rgba(255,255,255,0.05))',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '6px',
        minWidth: '120px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          height: '12px',
          width: '80%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: '3px',
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: '10px',
          width: '60%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

export default function NodeStatusStrip() {
  const { connectionStatus, nodes, nodesLoading } = useRealtimeStatus()
  const isDisconnected = connectionStatus === 'disconnected'
  const [notifications, setNotifications] = useState<NodeNotification[]>([])
  const prevStatusRef = useRef<Map<string, NodeStatus>>(new Map())

  // Detect node status transitions and fire notifications
  useEffect(() => {
    const prev = prevStatusRef.current
    const next = new Map<string, NodeStatus>()

    for (const node of nodes) {
      next.set(node.node_id, node.status)
      const prevStatus = prev.get(node.node_id)
      if (prevStatus !== undefined && prevStatus !== node.status) {
        if (node.status === 'offline') {
          const id = ++notifCounter
          const notif: NodeNotification = {
            id,
            nodeId: node.node_id,
            message: `${node.node_id.slice(0, 12)} went offline`,
            type: 'offline',
          }
          setNotifications((prev) => [...prev, notif])
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
          }, 8000)
        } else if (prevStatus === 'offline' && (node.status === 'online' || node.status === 'degraded')) {
          const id = ++notifCounter
          const notif: NodeNotification = {
            id,
            nodeId: node.node_id,
            message: `${node.node_id.slice(0, 12)} is back online`,
            type: 'online',
          }
          setNotifications((prev) => [...prev, notif])
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
          }, 8000)
        }
      }
    }

    prevStatusRef.current = next
  }, [nodes])

  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Disconnection banner */}
      {isDisconnected && (
        <div
          style={{
            background: 'rgba(255, 214, 10, 0.15)',
            border: '1px solid var(--warning, #FFD60A)',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            color: 'var(--warning, #FFD60A)',
            textAlign: 'center',
          }}
        >
          Connection lost — data may be stale
        </div>
      )}

      {/* Node cards strip */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {nodesLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : nodes.length === 0 ? (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary, rgba(255,255,255,0.4))',
              padding: '6px 0',
            }}
          >
            No nodes registered
          </span>
        ) : (
          nodes.map((node) => <NodeCard key={node.node_id} node={node} />)
        )}
      </div>

      {/* Node transition notifications */}
      {notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                background: notif.type === 'offline'
                  ? 'rgba(255, 69, 58, 0.12)'
                  : 'rgba(50, 215, 75, 0.12)',
                border: `1px solid ${notif.type === 'offline' ? 'var(--error, #FF453A)' : 'var(--success, #32D74B)'}`,
                color: notif.type === 'offline'
                  ? 'var(--error, #FF453A)'
                  : 'var(--success, #32D74B)',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <span>{notif.message}</span>
              <button
                onClick={() => dismissNotification(notif.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: '12px',
                  lineHeight: 1,
                  padding: '0 2px',
                  opacity: 0.7,
                  flexShrink: 0,
                }}
                aria-label="Dismiss"
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
