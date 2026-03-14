'use client'

import { useRealtimeStatus } from '@/components/RealtimeProvider'
import type { NodeRow, NodeStatus } from '@/types/supabase'

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
    </div>
  )
}
