# Token Map: Digital Circus → UUI Semantic Tokens

> Canonical equivalence table for the migration from Digital Circus custom tokens to Untitled UI PRO semantic tokens.

## Core Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--bg` | `#0C0C0C` | `--color-bg-primary` | Main background |
| `--background` | `#0C0C0C` | `--color-bg-primary` | Alias of --bg |
| `--foreground` | `#FFFFFF` | `--color-text-primary-900` | Main foreground |

## Surface Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--surface` | `#1A1A1A` | `--color-bg-secondary` | Card/panel backgrounds |
| `--surface-elevated` | `#242424` | `--color-bg-tertiary` | Elevated surfaces |
| `--surface-hover` | `#2E2E2E` | `--color-bg-quaternary` | Hover states |
| `--card` | `#1A1A1A` | `--color-bg-secondary` | Alias of --surface |
| `--card-elevated` | `#242424` | `--color-bg-tertiary` | Alias of --surface-elevated |

## Border Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--border` | `#2A2A2A` | `--color-border-primary` | Default borders |
| `--border-strong` | `#3A3A3A` | `--color-border-secondary` | Emphasized borders |

## Brand / Accent Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--accent` | `#FF3B30` | `--color-brand-600` | Primary brand color (Joan: keep #FF3B30) |
| `--accent-soft` | `rgba(255,59,48,0.125)` | `--color-brand-50` | Soft accent background |
| `--accent-hover` | `#FF524A` | `--color-brand-500` | Hover state |
| `--accent-muted` | `rgba(255,59,48,0.1)` | `--color-brand-50` | Legacy alias |

## Text Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--text-primary` | `#FFFFFF` | `--color-text-primary-900` | Primary text |
| `--text-secondary` | `#8A8A8A` | `--color-text-tertiary-600` | Secondary text |
| `--text-muted` | `#525252` | `--color-text-quaternary-500` | Muted/disabled text |

## Semantic Status Colors

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--positive` | `#32D74B` | `--color-success-500` | Success state |
| `--positive-soft` | `rgba(50,215,75,0.125)` | `--color-success-50` | Success background |
| `--negative` | `#FF453A` | `--color-error-500` | Error state |
| `--negative-soft` | `rgba(255,69,58,0.125)` | `--color-error-50` | Error background |
| `--warning` | `#FFD60A` | `--color-warning-500` | Warning state |
| `--warning-soft` | `rgba(255,214,10,0.125)` | `--color-warning-50` | Warning background |
| `--info` | `#0A84FF` | `--color-blue-500` | Info state |
| `--info-soft` | `rgba(10,132,255,0.125)` | `--color-blue-50` | Info background |

## Legacy Semantic Aliases (to be removed)

| Digital Circus Token | Value | Maps To | Notes |
|---------------------|-------|---------|-------|
| `--success` | `#32D74B` | Same as `--positive` | Duplicate — remove |
| `--success-bg` | `rgba(50,215,75,0.1)` | Same as `--positive-soft` | Duplicate — remove |
| `--error` | `#FF453A` | Same as `--negative` | Duplicate — remove |
| `--error-bg` | `rgba(255,69,58,0.1)` | Same as `--negative-soft` | Duplicate — remove |

## Activity Type Colors (Custom — no UUI equivalent)

These are OpenClaw-specific tokens. Will be defined as custom extensions in `theme.css`.

| Digital Circus Token | Value | UUI Strategy |
|---------------------|-------|-------------|
| `--type-file` | `#64D2FF` | Custom token: `--oc-type-file` |
| `--type-file-bg` | `rgba(100,210,255,0.125)` | Custom token: `--oc-type-file-bg` |
| `--type-search` | `#FFD60A` | Custom token: `--oc-type-search` |
| `--type-search-bg` | `rgba(255,214,10,0.125)` | Custom token: `--oc-type-search-bg` |
| `--type-message` | `#32D74B` | Custom token: `--oc-type-message` |
| `--type-message-bg` | `rgba(50,215,75,0.125)` | Custom token: `--oc-type-message-bg` |
| `--type-command` | `#BF5AF2` | Custom token: `--oc-type-command` |
| `--type-command-bg` | `rgba(191,90,242,0.125)` | Custom token: `--oc-type-command-bg` |
| `--type-cron` | `#FF375F` | Custom token: `--oc-type-cron` |
| `--type-cron-bg` | `rgba(255,55,95,0.125)` | Custom token: `--oc-type-cron-bg` |
| `--type-security` | `#FF453A` | Custom token: `--oc-type-security` |
| `--type-security-bg` | `rgba(255,69,58,0.125)` | Custom token: `--oc-type-security-bg` |
| `--type-build` | `#FF9F0A` | Custom token: `--oc-type-build` |
| `--type-build-bg` | `rgba(255,159,10,0.125)` | Custom token: `--oc-type-build-bg` |

## Typography

| Digital Circus Token | Value | UUI Strategy |
|---------------------|-------|-------------|
| `--font-heading` | `var(--font-sora), system-ui, sans-serif` | `--font-display` in theme.css (Sora) |
| `--font-body` | `var(--font-inter), system-ui, sans-serif` | `--font-text` in theme.css (Inter) |
| `--font-mono` | `var(--font-jetbrains), monospace` | `--font-code` in theme.css (JetBrains Mono) |

## Spacing / Radius

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--radius-sm` | `4px` | `--radius-sm` | Same naming |
| `--radius-md` | `8px` | `--radius-md` | Same naming |
| `--radius-lg` | `12px` | `--radius-lg` | Same naming |

## Shadows

| Digital Circus Token | Value | UUI Semantic Token | Notes |
|---------------------|-------|-------------------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | `--shadow-xs` | UUI uses xs/sm/md/lg/xl scale |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | `--shadow-md` | Direct mapping |

## Migration Notes

1. **No bridge file** — Old tokens remain in `globals.css` until nothing references them. Removed in Phase 7.
2. **Activity type tokens** — Custom to OpenClaw. Prefixed `--oc-*` in UUI theme.css.
3. **Brand color override** — UUI brand-600 = `#FF3B30` (Joan's red).
4. **Typography preserved** — Sora/Inter/JetBrains Mono carry over.
5. **96 files** reference `var(--*)` inline — migrated surface by surface in Phases 4-6.
