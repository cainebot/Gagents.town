"use client";

import { cx } from "@openclaw/ui";

const AGENT_STATUS_COLORS: Record<string, string> = {
  working: 'var(--success-500)',
  thinking: 'var(--success-500)',
  executing_tool: 'var(--success-500)',
  paused: 'var(--warning-500)',
  idle: 'var(--blue-500)',
  queued: 'var(--blue-500)',
  offline: 'var(--error-500)',
  error: 'var(--error-500)',
};

const DEFAULT_COLOR = 'var(--text-quaternary-500)';

/**
 * Returns the CSS color value for a given agent status string.
 * Useful when you need the color without the full component.
 */
export function statusDotClass(status: string): string {
  return AGENT_STATUS_COLORS[status.toLowerCase()] ?? DEFAULT_COLOR;
}

interface StatusDotProps {
  status: string;
  variant?: 'agent' | 'task';
  className?: string;
}

/**
 * A small colored dot indicating the status of an agent or task.
 * Uses CSS variable colors for each status state.
 */
export function StatusDot({ status, variant = 'agent', className }: StatusDotProps) {
  const color = statusDotClass(status);
  const size = variant === 'task' ? '6px' : '8px';

  return (
    <span
      className={cx("inline-block rounded-full shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      aria-label={`Status: ${status}`}
    />
  );
}
