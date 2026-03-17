"use client";

import { RealtimeProvider } from "@/components/RealtimeProvider";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { AgentFilterProvider } from "@/contexts/AgentFilterContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <AgentFilterProvider>
        <div className="flex h-screen" style={{ backgroundColor: 'var(--background)' }}>
          <DashboardSidebar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </AgentFilterProvider>
    </RealtimeProvider>
  );
}
