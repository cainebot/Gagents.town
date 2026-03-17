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
  Server,
  Map,
  Settings,
} from "lucide-react";

import { BrandMark } from "@/components/atoms/BrandMark";
import NodeStatusStrip from "@/components/NodeStatusStrip";
import { cn } from "@/lib/cn";
import { useAgentFilter } from "@/contexts/AgentFilterContext";
import { StatusDot } from "@/components/atoms/StatusDot";

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
      {
        label: "Workspaces",
        href: "/workspaces",
        icon: Server,
        isActive: (p) => p.startsWith("/workspaces"),
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

  // AgentFilter context — always safe to call because AgentFilterContext has a non-undefined defaultValue.
  // Outside an AgentFilterProvider (non-board pages), returns defaults: agents=[], selectedAgentId=null.
  const agentFilterContext = useAgentFilter();

  // Show AGENTS section only on single-board pages: /boards/[id]
  // Match: starts with /boards/ AND has a second path segment (not just /boards or /boards/)
  const isBoardDetailPage = /^\/boards\/[^/]+\/?$/.test(pathname);
  const showAgentSection = isBoardDetailPage;

  return (
    <aside
      className="sidebar-width shrink-0"
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand mark — fixed top */}
      <BrandMark />

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 12px' }} />

      {/* Scrollable navigation sections */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 0 }}>
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

        {/* AGENTS section — only on /boards/[id] pages */}
        {showAgentSection && (() => {
          const { agents, selectedAgentId, setSelectedAgentId, setAgentPanelOpen } = agentFilterContext;

          // Count active agents (not offline/error)
          const activeCount = agents.filter((a) =>
            ['working', 'thinking', 'paused', 'idle', 'queued'].includes(a.status)
          ).length;

          // Sort: LEAD badge first, then alphabetical
          const sortedAgents = [...agents].sort((a, b) => {
            const aIsLead = a.badge === 'LEAD' ? -1 : 0;
            const bIsLead = b.badge === 'LEAD' ? -1 : 0;
            if (aIsLead !== bIsLead) return aIsLead - bIsLead;
            return a.name.localeCompare(b.name);
          });

          const handleAgentClick = (agentId: string) => {
            if (selectedAgentId === agentId) {
              // Toggle off: deselect agent, close panel
              setSelectedAgentId(null);
              setAgentPanelOpen(false);
            } else {
              // Select agent: set filter + open panel
              setSelectedAgentId(agentId);
              setAgentPanelOpen(true);
            }
          };

          const handleAllAgentsClick = () => {
            setSelectedAgentId(null);
            setAgentPanelOpen(false);
          };

          return (
            <div>
              {/* Section label row — "AGENTS · N active" — clickable to reset */}
              <button
                onClick={handleAllAgentsClick}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  paddingLeft: '8px',
                  paddingBottom: '6px',
                  paddingTop: '2px',
                  fontFamily: 'var(--font-heading)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                AGENTS · {activeCount} active
              </button>

              {/* Agent list — max 200px with scroll */}
              <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="flex flex-col gap-0.5">
                {sortedAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.agent_id;
                  return (
                    <button
                      key={agent.agent_id}
                      onClick={() => handleAgentClick(agent.agent_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        background: isSelected ? 'rgba(255,59,48,0.10)' : 'none',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover, #2E2E2E)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'none';
                      }}
                    >
                      <StatusDot status={agent.status} variant="agent" />
                      {/* Emoji avatar */}
                      <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>
                        {agent.emoji || agent.name.charAt(0)}
                      </span>
                      {/* Agent name */}
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        textAlign: 'left',
                      }}>
                        {agent.name}
                      </span>
                      {/* Lead badge */}
                      {agent.badge === 'LEAD' && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: 'rgba(255,59,48,0.10)',
                          color: 'var(--accent)',
                          borderRadius: '9999px',
                          padding: '2px 6px',
                          flexShrink: 0,
                        }}>
                          Lead
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Fixed bottom — Office, Settings */}
      <div className="px-3 pt-2 pb-1" style={{ borderTop: '1px solid var(--border)' }}>
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

      {/* Fixed bottom — Node status strip */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <NodeStatusStrip />
      </div>
    </aside>
  );
}
