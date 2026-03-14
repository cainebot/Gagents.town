// ============================================================
// Supabase Database Types
// Mirrors the schema defined in infrastructure/init_supabase.sql
// ============================================================

export type NodeStatus = 'online' | 'offline' | 'degraded';

// 6 states as per Phase 3 spec (thinking + queued added via migration)
export type AgentStatus = 'idle' | 'working' | 'error' | 'offline' | 'thinking' | 'queued';

export type TaskStatus = 'pending' | 'claimed' | 'in_progress' | 'completed' | 'failed';

export type TaskType = 'general' | 'code-review' | 'deploy' | 'research' | 'build' | 'test';

export interface NodeRow {
  node_id: string;
  tailscale_ip: string;
  gateway_port: number;
  auth_token_hash: string;
  status: NodeStatus;
  agent_count: number;
  ram_usage_mb: number;
  ram_total_mb: number;
  last_heartbeat: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface AgentRow {
  agent_id: string;
  node_id: string;
  name: string;
  emoji: string;
  status: AgentStatus;
  current_task_id: string | null;
  avatar_model: string;
  last_activity: string; // ISO timestamp
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  task_id: string;
  source_agent_id: string | null;
  target_agent_id: string | null;
  title: string;
  type: string;
  status: TaskStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  max_retries: number;
  retry_count: number;
  created_at: string;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// Helper type for Supabase Realtime postgres_changes events
export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
};
