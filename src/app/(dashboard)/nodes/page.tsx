'use client'

import { useRealtimeStatus } from '@/components/RealtimeProvider'
import type { NodeRow, NodeStatus } from '@/types/supabase'
import { Server, Wifi, WifiOff, HardDrive, Users, Clock, Cpu } from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────

function getRamPercent(node: NodeRow): number {
  if (!node.ram_total_mb || node.ram_total_mb === 0) return 0
  return Math.round((node.ram_usage_mb / node.ram_total_mb) * 100)
}

function getRamBarColor(percent: number): string {
  if (percent > 85) return 'var(--error, #FF453A)'
  if (percent > 70) return 'var(--warning, #FFD60A)'
  return 'var(--success, #32D74B)'
}

function getCpuBarColor(percent: number): string {
  if (percent > 90) return 'var(--error, #FF453A)'
  if (percent > 70) return 'var(--warning, #FFD60A)'
  return 'var(--success, #32D74B)'
}

function statusColor(status: NodeStatus): string {
  if (status === 'online') return 'var(--success, #32D74B)'
  if (status === 'degraded') return 'var(--warning, #FFD60A)'
  return 'var(--error, #FF453A)'
}

function statusLabel(status: NodeStatus): string {
  if (status === 'online') return 'Online'
  if (status === 'degraded') return 'Degraded'
  return 'Offline'
}

function StatusIcon({ status }: { status: NodeStatus }) {
  const color = statusColor(status)
  if (status === 'online') return <Wifi size={14} color={color} />
  if (status === 'degraded') return <Wifi size={14} color={color} />
  return <WifiOff size={14} color={color} />
}

function relativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

// ── NodeCard ───────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: NodeRow
  agentNames: string[]
}

function NodeCard({ node, agentNames }: NodeCardProps) {
  const ramPercent = getRamPercent(node)
  const barColor = getRamBarColor(ramPercent)
  const cpuPercent = Math.round(node.cpu_percent ?? 0)
  const cpuBarColor = getCpuBarColor(cpuPercent)
  const color = statusColor(node.status)

  return (
    <div
      style={{
        background: 'var(--card, rgba(255,255,255,0.04))',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header: node ID + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Server size={18} color='var(--text-primary, #ffffff)' style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary, #ffffff)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={node.node_id}
          >
            {node.node_id}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '999px',
            background: `${color}22`,
            border: `1px solid ${color}55`,
            flexShrink: 0,
          }}
        >
          <StatusIcon status={node.status} />
          <span style={{ fontSize: '12px', fontWeight: 600, color }}>{statusLabel(node.status)}</span>
        </div>
      </div>

      {/* Tailscale IP */}
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
        {node.tailscale_ip}:{node.gateway_port}
      </p>

      {/* RAM usage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={13} color='var(--text-secondary, rgba(255,255,255,0.5))' />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>RAM</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-primary, #ffffff)' }}>
            {node.ram_usage_mb} MB / {node.ram_total_mb} MB ({ramPercent}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--border, rgba(255,255,255,0.1))',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${ramPercent}%`,
              height: '100%',
              background: barColor,
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* CPU usage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={13} color='var(--text-secondary, rgba(255,255,255,0.5))' />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>CPU</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-primary, #ffffff)' }}>
            {cpuPercent}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--border, rgba(255,255,255,0.1))',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${cpuPercent}%`,
              height: '100%',
              background: cpuBarColor,
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Agents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={13} color='var(--text-secondary, rgba(255,255,255,0.5))' />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(255,255,255,0.5))' }}>
            {node.agent_count} agent{node.agent_count !== 1 ? 's' : ''}
          </span>
        </div>
        {agentNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {agentNames.map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: 'var(--border, rgba(255,255,255,0.08))',
                  borderRadius: '4px',
                  color: 'var(--text-primary, rgba(255,255,255,0.8))',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Last heartbeat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={13} color='var(--text-secondary, rgba(255,255,255,0.5))' />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
          Last heartbeat: {relativeTime(node.last_heartbeat)}
        </span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

// ── AggregateSummary ───────────────────────────────────────────────────────

interface SummaryStatProps {
  label: string
  value: number | string
}

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 20px',
        background: 'var(--card, rgba(255,255,255,0.04))',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '10px',
        minWidth: '80px',
      }}
    >
      <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
        {value}
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.4))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function NodesPage() {
  const { connectionStatus, nodes, agents, nodesLoading } = useRealtimeStatus()
  const isDisconnected = connectionStatus === 'disconnected'

  // Aggregate summary stats
  const totalNodes = nodes.length
  const onlineNodes = nodes.filter((n) => n.status === 'online').length
  const degradedNodes = nodes.filter((n) => n.status === 'degraded').length
  const totalAgents = nodes.reduce((sum, n) => sum + (n.agent_count ?? 0), 0)

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Disconnection banner */}
      {isDisconnected && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            background: 'rgba(255, 214, 10, 0.1)',
            border: '1px solid var(--warning, #FFD60A)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--warning, #FFD60A)',
            fontSize: '13px',
          }}
        >
          <WifiOff size={16} />
          Connection lost — showing stale data. Attempting to reconnect…
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          Nodes
        </h1>
        {!nodesLoading && (
          <span
            style={{
              fontSize: '13px',
              padding: '3px 10px',
              background: 'var(--border, rgba(255,255,255,0.08))',
              borderRadius: '999px',
              color: 'var(--text-secondary, rgba(255,255,255,0.5))',
            }}
          >
            {nodes.length} registered
          </span>
        )}
      </div>

      {/* Aggregate summary strip */}
      {!nodesLoading && nodes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <SummaryStat label="Nodes" value={totalNodes} />
          <SummaryStat label="Online" value={onlineNodes} />
          <SummaryStat label="Agents" value={totalAgents} />
          <SummaryStat label="Degraded" value={degradedNodes} />
        </div>
      )}

      {/* Loading state */}
      {nodesLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '220px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                borderRadius: '12px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!nodesLoading && nodes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--text-secondary, rgba(255,255,255,0.4))',
          }}
        >
          <Server size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>No nodes registered yet</p>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Run <code style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>register-node.sh</code> on a machine to get started.
          </p>
        </div>
      )}

      {/* Node cards grid */}
      {!nodesLoading && nodes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {nodes.map((node) => {
            const agentNames = agents
              .filter((a) => a.node_id === node.node_id)
              .map((a) => `${a.emoji} ${a.name}`)
            return <NodeCard key={node.node_id} node={node} agentNames={agentNames} />
          })}
        </div>
      )}
    </div>
  )
}
