# UI-SYSTEM.md — OpenClaw Design System

> Master governance document for the Untitled UI PRO migration.
> All rules, conventions, and workflows derive from this file.

## System Overview

- **Design System:** Untitled UI React PRO (copy-paste, source-first)
- **Package:** `@openclaw/ui` at `packages/ui/`
- **Theme:** Dark default, light available
- **Brand:** `#FF3B30` (brand-600)
- **Typography:** Sora (headings), Inter (body), JetBrains Mono (code)
- **Component Library:** React Aria (accessibility), Tailwind CSS v4 (styling)
- **Storybook:** Oracle of truth for all visual components
- **Figma:** UUI PRO kit + Joan's customizations → Code Connect

## Governance Rules

1. **No token bridge** — Legacy tokens in `globals.css` coexist during migration. Removed when nothing references them. No bridge file.
2. **No compatibility wrappers** — Migrated components expose real UUI/React Aria API. No shims.
3. **No raw controls outside `@openclaw/ui`** — All new code imports from the package. No creating new primitives in `src/components/ui/`.
4. **No new inline styles** except allowlist: Office2D/Phaser canvas, Recharts chart internals, pixel-office SVG/canvas.
5. **No magic numbers** — Only semantic tokens. Exceptions documented here.
6. **No imports from legacy system in new code** — `src/components/ui/` imports forbidden in new files.
7. **Migration by complete surfaces** — Each page/feature exits 100% UUI or isn't touched. No permanent hybrid state.
8. **Token manifest versioned** — `tokens.json` always in PR. No blind Figma sync.

## Allowlist (Exceptions)

| Surface | Reason | What Migrates | What Stays |
|---------|--------|--------------|-----------|
| Office2D (Phaser) | Canvas/game engine | React wrappers | Canvas internals |
| Charts (Recharts) | Library-controlled rendering | Containers | fill/stroke → CSS vars |
| pixel-office (SVG) | Art assets | React chrome | SVG/canvas internals |
| Monaco Editor | Third-party editor | Container | Editor internals |

## Architecture

```
control-panel/                    ← workspace root
├── package.json                  ← workspaces: ["packages/*"]
├── packages/
│   └── ui/                       ← @openclaw/ui
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── components/
│       │   │   ├── base/         ← buttons, inputs, badges, select, etc.
│       │   │   ├── application/  ← modals, tables, tabs, pagination, etc.
│       │   │   ├── foundations/  ← featured-icon, social-icons, etc.
│       │   │   └── patterns/    ← OpenClaw patterns (SidePanel, FilterBar, etc.)
│       │   ├── styles/
│       │   │   ├── theme.css    ← UUI tokens + custom (brand-600=#FF3B30)
│       │   │   ├── typography.css
│       │   │   └── tokens.json  ← manifest versionado
│       │   ├── providers/
│       │   │   ├── theme.tsx    ← ThemeProvider (next-themes, dark default)
│       │   │   └── router-provider.tsx ← RouterProvider (React Aria)
│       │   ├── hooks/
│       │   ├── utils/
│       │   │   └── cx.ts       ← sortCx + tailwind-merge
│       │   └── index.ts        ← barrel export
│       ├── .storybook/
│       ├── figma.config.json
│       └── CLAUDE.md
├── src/                          ← Next.js app (consumer)
│   ├── app/
│   ├── components/               ← feature components (NOT design system)
│   ├── hooks/                    ← domain hooks
│   └── lib/
└── docs/
    ├── UI-SYSTEM.md              ← this file
    ├── TOKEN-MAP.md              ← Digital Circus → UUI equivalences
    └── COMPONENT-TAXONOMY.md     ← complete classification
```

## Import Conventions

```typescript
// Correct — import from package
import { Button, Badge, Modal } from "@openclaw/ui"
import { cx } from "@openclaw/ui"
import { ThemeProvider } from "@openclaw/ui"

// WRONG — legacy imports (forbidden in new code)
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
```

## Figma → Code Workflow

1. Joan updates Figma (UUI PRO kit + customizations)
2. Update `packages/ui/src/styles/tokens.json` to reflect changes
3. Update `packages/ui/src/styles/theme.css` with new token values
4. PR with diff of `tokens.json` for review
5. Code Connect auto-updates snippets in Figma Dev Mode

## Migration Phases

| Phase | Focus | Terminal |
|-------|-------|---------|
| 0 | Audit + Bootstrap | T1 |
| 1 | UUI PRO Install + Storybook | T1 |
| 2 | Swap 14 Primitives + Decouple | T1 |
| 3 | OpenClaw Patterns | T2 |
| 4 | Pilot: Cron Jobs | T2 |
| 5 | App Shell + 16 Simple Pages | T3 |
| 6 | Medium + Complex Pages | T4 |
| 7 | Purge + Enforcement + Docs | T1 |

## Enforcement Checks (Phase 7)

```bash
# All must return 0 matches
grep -r "var(--bg)\|var(--surface)\|var(--accent)\|var(--border)\|var(--text-" src/ --include="*.tsx" --include="*.css"
grep -r "@radix-ui" src/
grep -r "class-variance-authority" src/
grep -r "from ['\"]clsx['\"]" src/
grep -r "from ['\"]@/lib/cn['\"]" src/
grep -r "from ['\"]@/components/ui" src/
next build   # 0 errors
storybook build   # 0 errors
```
