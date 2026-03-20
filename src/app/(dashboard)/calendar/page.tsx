"use client";

import { WeeklyCalendar } from "@/components/WeeklyCalendar";

export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary-900)] mb-2">Calendar</h1>
        <p className="text-[var(--text-quaternary-500)]">
          Weekly view of scheduled tasks and cron jobs
        </p>
      </div>

      <WeeklyCalendar />
    </div>
  );
}
