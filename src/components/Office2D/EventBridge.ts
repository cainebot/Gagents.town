/**
 * Typed event bus for React <-> Phaser communication.
 *
 * React -> Phaser:
 *   'agents-updated': AgentRow[]          (Supabase Realtime data pushed to Phaser)
 *   'connection-status': ConnectionStatus (Realtime connection state)
 *   'tasks-updated': TaskRow[]            (Full tasks array pushed to Phaser)
 *   'task-assigned': { taskId, agentId, title } (Trigger worker emote)
 *   'task-completed': { taskId, agentId, title } (Trigger completion visual)
 *   'task-failed': { taskId, agentId, title }    (Trigger failure visual)
 *   'task-transferred': { taskId, fromAgentId, toAgentId, title } (Transfer animation)
 *
 * Phaser -> React:
 *   'agent-clicked': { agentId, x, y }   (Agent sprite clicked)
 *   'agent-approached': { agentId }       (Player walked near agent + pressed E)
 */

import type { AgentRow, NodeRow, TaskRow, DepartmentRow } from '@/types/supabase'
import type { ConnectionStatus } from '@/components/RealtimeProvider'

// ---------- Event map ----------

export interface EventBridgeMap {
  // React -> Phaser
  'agents-updated': AgentRow[]
  'nodes-updated': NodeRow[]
  'connection-status': ConnectionStatus
  'tasks-updated': TaskRow[]
  'departments-updated': DepartmentRow[]
  'task-assigned': { taskId: string; agentId: string; title: string }
  'task-completed': { taskId: string; agentId: string; title: string }
  'task-failed': { taskId: string; agentId: string; title: string }
  'task-transferred': { taskId: string; fromAgentId: string; toAgentId: string; title: string }

  // Phaser -> React
  'agent-clicked': { agentId: string; x: number; y: number; fallbackAgent?: AgentRow }
  'agent-approached': { agentId: string; fallbackAgent?: AgentRow }
}

// ---------- Listener type ----------

type Listener<T> = (data: T) => void

// ---------- EventBridge class ----------

export class EventBridge {
  private listeners = new Map<string, Set<Listener<unknown>>>()

  on<K extends keyof EventBridgeMap>(
    event: K,
    callback: Listener<EventBridgeMap[K]>,
  ): () => void {
    const key = event as string
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback as Listener<unknown>)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  off<K extends keyof EventBridgeMap>(
    event: K,
    callback: Listener<EventBridgeMap[K]>,
  ): void {
    this.listeners.get(event as string)?.delete(callback as Listener<unknown>)
  }

  emit<K extends keyof EventBridgeMap>(
    event: K,
    data: EventBridgeMap[K],
  ): void {
    this.listeners.get(event as string)?.forEach((fn) => {
      try {
        fn(data)
      } catch (err) {
        console.error(`[EventBridge] listener error on "${event}":`, err)
      }
    })
  }

  /** Remove all listeners (used on game destroy). */
  clear(): void {
    this.listeners.clear()
  }
}

// Singleton instance for the app
export const eventBridge = new EventBridge()
