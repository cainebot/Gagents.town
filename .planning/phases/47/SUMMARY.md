# Phase 47: Theming & Tokens — Brand Indigo + Primitives + Semantic Utilities

**Status**: Complete
**Branch**: phase/47-theming-tokens
**Completed**: 2026-03-20

## What was done

### 47a: Brand swap red → indigo
- Replaced brand scale in theme.css `:root` (dark) with UUI official indigo (#444CE7 = brand-600)
- Replaced brand scale in `[data-theme="light"]` with same indigo values (same scale both modes)
- Updated tokens.json brand section with matching hex values

### 47b: Separated error from brand
- Error scale stays red (#FF3B30 = error-600) — independent from brand
- Updated comment: "shares brand red" → "independent from brand"

### 47c: Accent transitional alias
- Added `--accent: var(--brand-600)` in `:root` with removal note

### 47d: @theme primitive registration
- Registered full scales (25-950) for: gray, brand, success, warning, error, blue
- Enables `bg-brand-600`, `text-gray-950`, `border-error-600` as native Tailwind classes

### 47e: @layer utilities semantic classes
- Defined bg-primary, bg-secondary, bg-tertiary, bg-quaternary, bg-overlay, etc.
- Defined text-primary, text-secondary, text-tertiary, text-quaternary, etc.
- Defined border-primary, border-secondary, border-tertiary, etc.
- Defined fg-primary through fg-white (icon colors)
- bg-brand-solid, bg-error-solid, bg-success-solid

### 47f: Updated references
- button.tsx focus ring: `outline-[#FF3B30]` → `outline-brand-600`
- CLAUDE.md (both root and packages/ui): `#FF3B30` → `#444CE7`

## Requirements covered

- BRND-01: Brand color uses UUI official indigo (#444CE7)
- BRND-02: Error scale independent from brand
- BRND-03: tokens.json matches theme.css
- BRND-04: --accent alias defined
- BRND-05: CLAUDE.md files updated
- BRND-06: button.tsx focus ring uses brand indigo
- THEM-01 through THEM-06: @theme + @layer utilities blocks

## Verification

- `next build` passes ✓
- Zero `#FF3B30` in brand scale ✓
- Error scale retains `#FF3B30` independently ✓
