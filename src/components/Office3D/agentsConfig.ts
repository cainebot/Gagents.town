/**
 * Office 3D — Agent Configuration
 *
 * This file defines the visual layout of agents in the 3D office.
 * Names, emojis and roles are loaded at runtime from the OpenClaw API
 * (/api/agents → openclaw.json), so you only need to set positions and colors here.
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent)
 *   id: "studio"   → workspace-studio/
 *   id: "infra"    → workspace-infra/
 *   etc.
 *
 * Add, remove or reposition agents to match your own OpenClaw setup.
 */

import type { AgentRow } from '@/types/supabase';

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
}

// Fallback desk grid positions (first 6 match legacy AGENTS, then extends)
const DESK_POSITIONS: [number, number, number][] = [
  [0, 0, 0],    // Center — main desk
  [-4, 0, -3],
  [4, 0, -3],
  [-4, 0, 3],
  [4, 0, 3],
  [0, 0, 6],
  // Extended positions for more agents
  [-8, 0, 0],
  [8, 0, 0],
  [-4, 0, 9],
  [4, 0, 9],
  [0, 0, -6],
  [-8, 0, -6],
  [8, 0, -6],
];

/**
 * Returns a desk position based on agent index.
 * Reuses DESK_POSITIONS for the first N entries, then generates overflow positions.
 */
export function assignDeskPosition(index: number): [number, number, number] {
  if (index < DESK_POSITIONS.length) {
    return DESK_POSITIONS[index];
  }
  // Overflow: simple grid expansion
  const col = (index - DESK_POSITIONS.length) % 4;
  const row = Math.floor((index - DESK_POSITIONS.length) / 4);
  return [(-6 + col * 4) as number, 0, (12 + row * 4) as number];
}

// Default agent color palette (cycles through when metadata has no color)
const DEFAULT_COLORS = [
  '#FFCC00',
  '#4CAF50',
  '#E91E63',
  '#0077B5',
  '#9C27B0',
  '#607D8B',
  '#FF9800',
  '#00BCD4',
];

/**
 * Maps a Supabase AgentRow to the AgentState shape expected by the 3D office.
 * Pulls model and color from the metadata JSONB field when available.
 */
export function agentRowToState(agent: AgentRow): AgentState {
  const meta = agent.metadata ?? {};
  return {
    id: agent.agent_id,
    status: agent.status,
    currentTask: agent.current_task_id ?? undefined,
    model: typeof meta['model'] === 'string' ? meta['model'] : undefined,
    tokensPerHour: typeof meta['tokens_per_hour'] === 'number' ? meta['tokens_per_hour'] : undefined,
    tasksInQueue: typeof meta['tasks_in_queue'] === 'number' ? meta['tasks_in_queue'] : undefined,
    uptime: typeof meta['uptime_days'] === 'number' ? meta['uptime_days'] : undefined,
  };
}

/**
 * Builds an AgentConfig from an AgentRow plus its assigned position index.
 */
export function agentRowToConfig(agent: AgentRow, index: number): AgentConfig {
  const meta = agent.metadata ?? {};
  const color =
    typeof meta['color'] === 'string'
      ? meta['color']
      : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return {
    id: agent.agent_id,
    name: agent.name,
    emoji: agent.emoji,
    position: assignDeskPosition(index),
    color,
    role: typeof meta['role'] === 'string' ? meta['role'] : 'Agent',
  };
}

export const AGENTS: AgentConfig[] = [
  {
    id: "main",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Mission Control",
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🦞",
    position: [0, 0, 0], // Center — main desk
    color: "#FFCC00",
    role: "Main Agent",
  },
  {
    id: "agent-2",
    name: "Agent 2",
    emoji: "🤖",
    position: [-4, 0, -3],
    color: "#4CAF50",
    role: "Sub-agent",
  },
  {
    id: "agent-3",
    name: "Agent 3",
    emoji: "🤖",
    position: [4, 0, -3],
    color: "#E91E63",
    role: "Sub-agent",
  },
  {
    id: "agent-4",
    name: "Agent 4",
    emoji: "🤖",
    position: [-4, 0, 3],
    color: "#0077B5",
    role: "Sub-agent",
  },
  {
    id: "agent-5",
    name: "Agent 5",
    emoji: "🤖",
    position: [4, 0, 3],
    color: "#9C27B0",
    role: "Sub-agent",
  },
  {
    id: "agent-6",
    name: "Agent 6",
    emoji: "🤖",
    position: [0, 0, 6],
    color: "#607D8B",
    role: "Sub-agent",
  },
];

// All 6 states: idle, working, error, offline, thinking, queued
export type AgentStatus = 'idle' | 'working' | 'error' | 'offline' | 'thinking' | 'queued';

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string; // opus, sonnet, haiku
  tokensPerHour?: number;
  tasksInQueue?: number;
  uptime?: number; // days
}
