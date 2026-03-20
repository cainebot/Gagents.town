"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, AlertCircle, LayoutGrid, CalendarDays, Zap } from "lucide-react";
import { Button, Badge, LoadingIndicator, OCEmptyState, MetricCard, FeaturedIcon } from "@openclaw/ui";
import { CronJobCard, type CronJob } from "@/components/CronJobCard";
import { CronWeeklyTimeline } from "@/components/CronWeeklyTimeline";

type ViewMode = "cards" | "timeline";

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [runToast, setRunToast] = useState<{ id: string; status: "success" | "error"; name: string } | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/cron");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/cron", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update job");
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? { ...job, enabled } : job))
      );
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update job status");
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      const res = await fetch(`/api/cron?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs((prev) => prev.filter((job) => job.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete job");
    }
  };

  const handleRun = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    const res = await fetch("/api/cron/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setRunToast({ id, status: "error", name: job?.name || id });
      setTimeout(() => setRunToast(null), 4000);
      throw new Error(data.error || "Trigger failed");
    }

    setRunToast({ id, status: "success", name: job?.name || id });
    setTimeout(() => setRunToast(null), 4000);
  };

  const activeJobs = jobs.filter((j) => j.enabled).length;
  const pausedJobs = jobs.length - activeJobs;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <div>
          <h1 className="mb-1 font-display text-2xl font-bold text-white md:text-3xl">
            Cron Jobs
          </h1>
          <p className="text-sm text-gray-700 md:text-base">
            Scheduled tasks from OpenClaw Gateway
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-[3px]">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-[#FF3B30] text-white"
                  : "text-gray-700 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "timeline"
                  ? "bg-[#FF3B30] text-white"
                  : "text-gray-700 hover:text-white"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Timeline
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            iconLeading={<RefreshCw className="h-4 w-4" />}
            onPress={() => { setIsLoading(true); fetchJobs(); }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mb-8 md:gap-4">
        <MetricCard
          label="Total Jobs"
          value={jobs.length}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          label="Active"
          value={activeJobs}
          icon={<RefreshCw className="h-5 w-5" />}
          badge={{ label: "Running", variant: "success" }}
        />
        <MetricCard
          label="Paused"
          value={pausedJobs}
          icon={<AlertCircle className="h-5 w-5" />}
          badge={pausedJobs > 0 ? { label: "Paused", variant: "warning" } : undefined}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-600/30 bg-red-600/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-500">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto border-none bg-transparent text-red-500 hover:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingIndicator size="md" label="Loading cron jobs..." />
        </div>
      ) : jobs.length === 0 ? (
        <OCEmptyState
          icon={<Clock className="h-8 w-8 text-gray-600" />}
          title="No cron jobs found"
          description="Create cron jobs via Telegram or the OpenClaw CLI"
        />
      ) : viewMode === "timeline" ? (
        /* Timeline View */
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
            <CalendarDays className="h-5 w-5 text-[#FF3B30]" />
            <h2 className="font-display text-base font-bold text-white">
              7-Day Schedule Overview
            </h2>
            <Badge variant="gray" size="sm" className="ml-auto">
              All times in local timezone
            </Badge>
          </div>
          <CronWeeklyTimeline jobs={jobs} />
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 md:gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="relative">
              <CronJobCard
                job={job}
                onToggle={handleToggle}
                onEdit={() => {}}
                onDelete={handleDelete}
                onRun={handleRun}
              />
              {deleteConfirm === job.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/90 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="mb-4 text-white">Delete &quot;{job.name}&quot;?</p>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onPress={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" onPress={() => handleDelete(job.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Run toast notification */}
      {runToast && (
        <div
          className={`fixed bottom-10 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-right ${
            runToast.status === "success"
              ? "border border-green-500/40 bg-green-500/15"
              : "border border-red-500/40 bg-red-500/15"
          }`}
        >
          <Zap
            className={`h-4 w-4 ${
              runToast.status === "success" ? "text-green-400" : "text-red-400"
            }`}
          />
          {runToast.status === "success"
            ? `✓ "${runToast.name}" triggered!`
            : `✗ Failed to trigger "${runToast.name}"`}
        </div>
      )}
    </div>
  );
}
