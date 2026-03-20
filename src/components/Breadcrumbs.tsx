"use client";

import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
  prefix?: string;
}

export function Breadcrumbs({ path, onNavigate, prefix = "workspace" }: BreadcrumbsProps) {
  const segments = path.split("/").filter(Boolean);

  const handleClick = (index: number) => {
    const newPath = segments.slice(0, index + 1).join("/");
    onNavigate(newPath);
  };

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      <button
        onClick={() => onNavigate("")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          borderRadius: "4px",
          color: "var(--text-tertiary-600)",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-quaternary)";
          e.currentTarget.style.color = "var(--text-primary-900)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary-600)";
        }}
        title="Go to root"
      >
        <Home className="w-4 h-4" />
        <span>{prefix}</span>
      </button>

      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-quaternary-500)" }} />
          <button
            onClick={() => handleClick(index)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              color: index === segments.length - 1 ? "var(--text-primary-900)" : "var(--text-tertiary-600)",
              fontWeight: index === segments.length - 1 ? 600 : 400,
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              if (index !== segments.length - 1) {
                e.currentTarget.style.backgroundColor = "var(--bg-quaternary)";
                e.currentTarget.style.color = "var(--text-primary-900)";
              }
            }}
            onMouseLeave={(e) => {
              if (index !== segments.length - 1) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-tertiary-600)";
              }
            }}
          >
            {segment}
          </button>
        </div>
      ))}
    </nav>
  );
}
