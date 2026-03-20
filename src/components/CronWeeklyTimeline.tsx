"use client";

import { useMemo } from "react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { Clock, Repeat, CalendarX } from "lucide-react";
import { OCEmptyState } from "@openclaw/ui";
import { getNextRuns, isValidCron } from "@/lib/cron-parser";
import type { CronJob } from "./CronJobCard";

interface ScheduledEvent {
  job: CronJob;
  time: Date;
  color: string;
  isInterval: boolean;
}

interface DayColumn {
  date: Date;
  label: string;
  subLabel: string;
  isToday: boolean;
  events: ScheduledEvent[];
  intervalJobs: { job: CronJob; color: string; intervalLabel: string }[];
}

// Pastel-ish colors that look great on dark backgrounds
const JOB_COLORS = [
  "#FF6B6B", // coral red
  "#4FC3F7", // sky blue
  "#81C784", // sage green
  "#FFB74D", // amber
  "#CE93D8", // lavender
  "#F48FB1", // pink
  "#80DEEA", // teal
  "#FFCC02", // yellow (accent)
  "#A5D6A7", // mint
  "#FF8A65", // deep orange
];

function getJobColor(index: number): string {
  return JOB_COLORS[index % JOB_COLORS.length];
}

function getScheduleExpr(schedule: string | Record<string, unknown>): string | null {
  if (typeof schedule === "string") return schedule;
  if (schedule && typeof schedule === "object" && schedule.kind === "cron") {
    return (schedule.expr as string) || null;
  }
  return null;
}

function getIntervalMs(schedule: string | Record<string, unknown>): number | null {
  if (typeof schedule === "object" && schedule && schedule.kind === "every") {
    return (schedule.everyMs as number) || null;
  }
  return null;
}

function getAtTime(schedule: string | Record<string, unknown>): Date | null {
  if (typeof schedule === "object" && schedule && schedule.kind === "at") {
    const at = schedule.at as string;
    if (at) return new Date(at);
  }
  return null;
}

function formatIntervalLabel(ms: number): string {
  if (ms >= 86400000) return `Every ${Math.round(ms / 86400000)}d`;
  if (ms >= 3600000) return `Every ${Math.round(ms / 3600000)}h`;
  if (ms >= 60000) return `Every ${Math.round(ms / 60000)}m`;
  return `Every ${Math.round(ms / 1000)}s`;
}

function getJobEmoji(agentId: string): string {
  const emojis: Record<string, string> = {
    main: "🦞",
    academic: "🎓",
    infra: "🔧",
    studio: "🎬",
    social: "📱",
    linkedin: "💼",
    freelance: "💼",
  };
  return emojis[agentId] || "🤖";
}

interface CronWeeklyTimelineProps {
  jobs: CronJob[];
}

export function CronWeeklyTimeline({ jobs }: CronWeeklyTimelineProps) {
  const now = useMemo(() => new Date(), []);
  const sevenDaysOut = useMemo(
    () => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    [now]
  );

  const days = useMemo<DayColumn[]>(() => {
    const enabledJobs = jobs.filter((j) => j.enabled);

    // Compute all events for next 7 days
    const allEvents: ScheduledEvent[] = [];
    const intervalJobMap = new Map<
      string,
      { job: CronJob; color: string; intervalLabel: string }
    >();

    enabledJobs.forEach((job, idx) => {
      const color = getJobColor(idx);
      const expr = getScheduleExpr(job.schedule);
      const intervalMs = getIntervalMs(job.schedule);
      const atTime = getAtTime(job.schedule);

      if (expr && isValidCron(expr)) {
        const runs = getNextRuns(expr, 50, now);
        runs
          .filter((r) => r >= startOfDay(now) && r <= sevenDaysOut)
          .forEach((time) => {
            allEvents.push({ job, time, color, isInterval: false });
          });
      } else if (intervalMs) {
        const label = formatIntervalLabel(intervalMs);
        if (!intervalJobMap.has(job.id)) {
          intervalJobMap.set(job.id, { job, color, intervalLabel: label });
        }
        if (intervalMs >= 86400000) {
          let next = job.nextRun ? new Date(job.nextRun) : now;
          while (next <= sevenDaysOut) {
            if (next >= startOfDay(now)) {
              allEvents.push({ job, time: new Date(next), color, isInterval: true });
            }
            next = new Date(next.getTime() + intervalMs);
          }
        }
      } else if (atTime && atTime > now && atTime <= sevenDaysOut) {
        allEvents.push({ job, time: atTime, color, isInterval: false });
      }
    });

    // Build day columns
    const columns: DayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfDay(now), i);
      const dayEnd = addDays(date, 1);
      const isToday = isSameDay(date, now);

      const dayEvents = allEvents
        .filter((e) => e.time >= date && e.time < dayEnd)
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      const dayIntervalJobs = Array.from(intervalJobMap.values());

      columns.push({
        date,
        label: isToday ? "Today" : format(date, "EEE d"),
        subLabel: isToday ? format(date, "EEE d") : format(date, "MMM"),
        isToday,
        events: dayEvents,
        intervalJobs: dayIntervalJobs,
      });
    }

    return columns;
  }, [jobs, now, sevenDaysOut]);

  const totalEvents = useMemo(
    () => days.reduce((sum, d) => sum + d.events.length, 0),
    [days]
  );

  if (jobs.filter((j) => j.enabled).length === 0) {
    return (
      <OCEmptyState
        icon={<CalendarX className="h-12 w-12 text-gray-600 opacity-40" />}
        title="No active jobs to display"
      />
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {jobs
          .filter((j) => j.enabled)
          .map((job, idx) => {
            const color = getJobColor(idx);
            return (
              <div
                key={job.id}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}40`,
                  color: color,
                }}
              >
                <div
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {getJobEmoji(job.agentId)} {job.name}
              </div>
            );
          })}
        <div className="ml-auto self-center text-xs text-gray-600">
          {totalEvents} scheduled events in the next 7 days
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className={`min-w-[120px] overflow-hidden rounded-xl border ${
              day.isToday
                ? "border-[#FF3B30]/40 bg-[#FF3B30]/[0.08]"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {/* Day Header */}
            <div
              className={`border-b border-white/10 px-3 py-2 ${
                day.isToday ? "bg-[#FF3B30]/[0.12]" : ""
              }`}
            >
              <div
                className={`font-display text-xs font-bold ${
                  day.isToday ? "text-[#FF3B30]" : "text-white"
                }`}
              >
                {day.label}
              </div>
              <div className="mt-px text-[0.65rem] text-gray-600">
                {day.subLabel}
              </div>
            </div>

            {/* Events */}
            <div className="flex min-h-[80px] flex-col gap-1 p-2">
              {day.events.length === 0 && day.intervalJobs.length === 0 && (
                <div className="flex h-20 items-center justify-center text-[0.7rem] text-gray-600 opacity-50">
                  —
                </div>
              )}

              {/* One-time / cron events */}
              {day.events.map((event, eIdx) => (
                <div
                  key={`${event.job.id}-${eIdx}`}
                  title={`${event.job.name}\n${format(event.time, "HH:mm")}`}
                  className="flex flex-col gap-px rounded-md px-2 py-1"
                  style={{
                    backgroundColor: `${event.color}18`,
                    border: `1px solid ${event.color}35`,
                  }}
                >
                  <div
                    className="flex items-center gap-1 text-[0.65rem] font-bold"
                    style={{ color: event.color }}
                  >
                    <Clock className="h-[9px] w-[9px] flex-shrink-0" />
                    {format(event.time, "HH:mm")}
                    {event.isInterval && (
                      <Repeat className="h-[9px] w-[9px] opacity-70" />
                    )}
                  </div>
                  <div className="max-w-full truncate text-[0.65rem] font-medium text-gray-700">
                    {getJobEmoji(event.job.agentId)} {event.job.name}
                  </div>
                </div>
              ))}

              {/* Interval jobs (< 24h frequency) */}
              {day.intervalJobs.map(({ job, color, intervalLabel }) => (
                <div
                  key={`${job.id}-interval`}
                  title={`${job.name} — ${intervalLabel}`}
                  className="flex flex-col gap-px rounded-md border-dashed px-2 py-1"
                  style={{
                    backgroundColor: `${color}12`,
                    border: `1px dashed ${color}25`,
                  }}
                >
                  <div
                    className="flex items-center gap-1 text-[0.65rem] font-bold"
                    style={{ color: color }}
                  >
                    <Repeat className="h-[9px] w-[9px] flex-shrink-0" />
                    {intervalLabel}
                  </div>
                  <div className="truncate text-[0.65rem] font-medium text-gray-700">
                    {getJobEmoji(job.agentId)} {job.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
