"use client";

import { useState, useCallback } from "react";
import {
  Clock,
  Calendar,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
  Zap,
  CheckCircle2,
  XCircle,
  History,
  Loader2,
} from "lucide-react";
import { Button, Badge, StatusBadge, LoadingIndicator } from "@openclaw/ui";

export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  description: string;
  schedule: string | Record<string, unknown>;
  scheduleDisplay: string;
  timezone: string;
  enabled: boolean;
  nextRun: string | null;
  lastRun: string | null;
  sessionTarget: string;
  payload: Record<string, unknown>;
}

interface RunHistoryEntry {
  id: string;
  jobId: string;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  durationMs: number | null;
  error: string | null;
}

interface CronJobCardProps {
  job: CronJob;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (job: CronJob) => void;
  onDelete: (id: string) => void;
  onRun?: (id: string) => Promise<void>;
}

const AGENT_EMOJI: Record<string, string> = {
  main: "🦞",
  academic: "🎓",
  infra: "🔧",
  studio: "🎬",
  social: "📱",
  linkedin: "💼",
  freelance: "🔧",
};

export function CronJobCard({ job, onToggle, onDelete, onRun }: CronJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<"success" | "error" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggle(job.id, !job.enabled);
    setIsToggling(false);
  };

  const handleRun = useCallback(async () => {
    if (!onRun || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      await onRun(job.id);
      setRunResult("success");
    } catch {
      setRunResult("error");
    } finally {
      setIsRunning(false);
      setTimeout(() => setRunResult(null), 3000);
    }
  }, [job.id, onRun, isRunning]);

  const loadHistory = useCallback(async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/cron/runs?id=${job.id}`);
      if (res.ok) {
        const data = await res.json();
        setRunHistory(data.runs || []);
      }
    } catch {
      setRunHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [job.id, loadingHistory]);

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && runHistory.length === 0) {
      loadHistory();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return "overdue";
    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return "now";
  };

  const agentEmoji = AGENT_EMOJI[job.agentId] || "🤖";

  const formatHistoryDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        job.enabled
          ? "border-white/10 bg-white/5"
          : "border-white/5 bg-white/[0.03] opacity-60"
      }`}
    >
      <div className="p-3 md:p-5">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2 md:mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <span title={job.agentId}>{agentEmoji}</span>
              <h3 className="truncate font-display text-sm font-semibold text-white md:text-lg">
                {job.name}
              </h3>
              <StatusBadge
                status={job.enabled ? "active" : "inactive"}
                label={job.enabled ? "Active" : "Paused"}
                size="sm"
              />
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-700 md:mt-1 md:text-sm">
              {job.description}
            </p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            title={job.enabled ? "Pause job" : "Enable job"}
            className={`flex-shrink-0 rounded-lg p-1.5 transition-all md:p-2 ${
              isToggling ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${
              job.enabled
                ? "bg-green-500/20 text-green-400"
                : "bg-white/5 text-gray-600"
            }`}
          >
            {isToggling ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent md:h-5 md:w-5" />
            ) : job.enabled ? (
              <Pause className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Play className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </button>
        </div>

        {/* Schedule Info */}
        <div className="mb-2 flex flex-wrap gap-2 md:mb-4 md:gap-4">
          <div className="flex items-center gap-1.5 text-xs md:gap-2 md:text-sm">
            <Clock className="h-3.5 w-3.5 text-blue-600 md:h-4 md:w-4" />
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 md:px-2 md:text-xs">
              {job.scheduleDisplay}
            </code>
          </div>
          <div className="flex items-center gap-1.5 text-xs md:gap-2 md:text-sm">
            <Bot className="h-3.5 w-3.5 text-gray-600 md:h-4 md:w-4" />
            <span className="text-gray-600">{job.sessionTarget}</span>
          </div>
        </div>

        {/* Next Run */}
        {job.enabled && job.nextRun && (
          <div className="mb-2 flex flex-wrap items-center gap-1 text-xs md:mb-4 md:gap-2 md:text-sm">
            <Calendar className="h-3.5 w-3.5 text-[#FF375F] md:h-4 md:w-4" />
            <span className="text-gray-700">Next:</span>
            <span className="text-white">{formatDate(job.nextRun)}</span>
            <span className="text-[#FF375F]">({getRelativeTime(job.nextRun)})</span>
          </div>
        )}

        {/* Expand/Collapse for Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 border-none bg-transparent text-xs text-gray-600 transition-colors hover:text-gray-700 md:text-sm"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Hide details</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Show details</span>
            </>
          )}
        </button>

        {/* Expanded: Details */}
        {expanded && (
          <div className="mt-2 flex flex-col gap-1 border-l-2 border-white/10 pl-3 text-xs md:mt-3 md:gap-2 md:pl-4 md:text-sm">
            <div>
              <span className="text-gray-600">ID: </span>
              <code className="text-[0.7rem] text-gray-700">{job.id}</code>
            </div>
            <div>
              <span className="text-gray-600">Agent: </span>
              <span className="text-gray-700">{agentEmoji} {job.agentId}</span>
            </div>
            {job.lastRun && (
              <div>
                <span className="text-gray-600">Last run: </span>
                <span className="text-gray-700">{formatDate(job.lastRun)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Timezone: </span>
              <span className="text-gray-700">{job.timezone}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1 border-t border-white/10 pt-2 md:mt-4 md:gap-2 md:pt-4">
          <Button
            variant="ghost"
            size="sm"
            iconLeading={<Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            onPress={() => onDelete(job.id)}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>

          {/* History button */}
          <Button
            variant={showHistory ? "secondary" : "ghost"}
            size="sm"
            iconLeading={<History className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            onPress={handleToggleHistory}
          >
            <span className="hidden sm:inline">History</span>
          </Button>

          <div className="flex-1" />

          {/* Run Now button */}
          {onRun && (
            <Button
              variant={runResult === "error" ? "danger" : "primary"}
              size="sm"
              isLoading={isRunning}
              isDisabled={isRunning}
              iconLeading={
                runResult === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : runResult === "error" ? (
                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : (
                  <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )
              }
              onPress={handleRun}
            >
              <span className="hidden sm:inline">
                {isRunning ? "Running…" : runResult === "success" ? "Triggered!" : runResult === "error" ? "Failed" : "Run Now"}
              </span>
            </Button>
          )}
        </div>

        {/* Run History Panel */}
        {showHistory && (
          <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-semibold text-gray-700">
              <History className="h-3.5 w-3.5" />
              Recent Runs
              {loadingHistory && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
            </div>

            {!loadingHistory && runHistory.length === 0 && (
              <div className="p-3 text-center text-xs text-gray-600">
                No run history available
              </div>
            )}

            {runHistory.slice(0, 5).map((run, idx) => (
              <div
                key={run.id || idx}
                className={`flex items-center gap-2 px-3 py-2 text-xs ${
                  idx < Math.min(runHistory.length, 5) - 1 ? "border-b border-white/10" : ""
                }`}
              >
                {run.status === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                ) : run.status === "error" ? (
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                )}
                <span className="flex-1 text-gray-700">
                  {formatHistoryDate(run.startedAt)}
                </span>
                <span className="text-gray-600">
                  {formatDuration(run.durationMs)}
                </span>
                {run.error && (
                  <span
                    className="max-w-[100px] truncate text-red-400"
                    title={run.error}
                  >
                    {run.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
