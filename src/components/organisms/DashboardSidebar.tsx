"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  FolderKanban,
  Kanban,
  Tag,
  CheckSquare,
  SlidersHorizontal,
  Store,
  Package,
  Building2,
  Zap,
  Bot,
  Map,
  Settings,
} from "lucide-react";

import { BrandMark } from "@/components/atoms/BrandMark";
import NodeStatusStrip from "@/components/NodeStatusStrip";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType<{ className?: string; size?: number }>;
  isActive: (pathname: string) => boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        isActive: (p) => p === "/dashboard" || p === "/",
      },
      {
        label: "Live feed",
        href: "/activity",
        icon: Activity,
        isActive: (p) => p.startsWith("/activity"),
      },
    ],
  },
  {
    label: "BOARDS",
    items: [
      {
        label: "Board groups",
        href: "/board-groups",
        icon: FolderKanban,
        isActive: (p) => p.startsWith("/board-groups"),
      },
      {
        label: "Boards",
        href: "/boards",
        icon: Kanban,
        isActive: (p) => p.startsWith("/boards"),
      },
      {
        label: "Tags",
        href: "/tags",
        icon: Tag,
        isActive: (p) => p.startsWith("/tags"),
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: CheckSquare,
        isActive: (p) => p.startsWith("/approvals"),
      },
      {
        label: "Custom fields",
        href: "/custom-fields",
        icon: SlidersHorizontal,
        isActive: (p) => p.startsWith("/custom-fields"),
      },
    ],
  },
  {
    label: "SKILLS",
    items: [
      {
        label: "Marketplace",
        href: "/marketplace",
        icon: Store,
        isActive: (p) => p.startsWith("/marketplace"),
      },
      {
        label: "Packs",
        href: "/skills",
        icon: Package,
        isActive: (p) => p.startsWith("/skills"),
      },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Organization",
        href: "/organization",
        icon: Building2,
        isActive: (p) => p.startsWith("/organization"),
      },
      {
        label: "Gateways",
        href: "/gateways",
        icon: Zap,
        isActive: (p) => p.startsWith("/gateways"),
      },
      {
        label: "Agents",
        href: "/agents",
        icon: Bot,
        isActive: (p) => p.startsWith("/agents"),
      },
    ],
  },
];

// Additional bottom nav items (not in sections)
const BOTTOM_NAV: NavItem[] = [
  {
    label: "Office",
    href: "/office",
    icon: Map,
    isActive: (p) => p.startsWith("/office"),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    isActive: (p) => p.startsWith("/settings"),
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar-width flex flex-col shrink-0"
      style={{
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        minHeight: '100vh',
      }}
    >
      {/* Brand mark */}
      <BrandMark />

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 12px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                paddingLeft: '8px',
                paddingBottom: '6px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {section.label}
            </div>

            {/* Section items */}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-item", active && "active")}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom nav items (Office, Settings) */}
        <div className="mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-0.5">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-item", active && "active")}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Node status strip at bottom */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <NodeStatusStrip />
      </div>
    </aside>
  );
}
