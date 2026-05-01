---
name: holyrics-design-system
description: Use this whenever working on UI, pages, layouts, components, styling, responsiveness, dashboards, settings screens, list screens, or any visual change in holyrics-control-web. Enforces the project's minimal and elegant design system built on shadcn/ui, including the canonical `/design` route, semantic tokens, and app-level composition primitives.
---

# Holyrics Design System

Use this skill for any visual work in this repository.

## Goal

Preserve the project's design system:

- minimal, calm, elegant
- based on the existing shadcn preset and semantic tokens
- responsive across mobile, tablet, and desktop
- composed from reusable patterns, not route-local one-off styling

## Canonical References

Read these first when touching UI:

- `src/routes/design.tsx`
- `src/components/design-system/`
- `src/index.css`

The `/design` route is the source of truth for the visual system. New product UI should look like it belongs there.

## Required Rules

1. Compose from existing shadcn components first.
2. Use the app-level primitives in `src/components/design-system/` before inventing new wrappers or bespoke containers.
3. Use semantic tokens such as `bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10`.
4. Prefer `PageHeader`, `ToolbarRow`, `SearchToolbar`, `SurfaceCard`, `MetricCard`, `StatusChip`, `SectionBlock`, and `EmptyStateSection` for product screens.
5. Keep layouts mobile-first. Stack by default, then expand with `md:` and `xl:` layouts.
6. Match the project's tone: refined spacing, low visual noise, limited accent usage, strong hierarchy.

## Do Not

- Do not hard-code route-specific palettes like `bg-zinc-950`, `text-white`, or arbitrary neon effects for product UI.
- Do not build raw search bars with manual `<input>` markup when `SearchToolbar` or `InputGroup` fits.
- Do not create custom alert, badge, or empty-state markup when shadcn primitives already exist.
- Do not override core shadcn component colors through `className` unless there is a system-level reason.
- Do not reinvent layout structure separately on each page.

## Layout Expectations

- Page shells should use `AppPage`.
- Page intros should use `PageHeader`.
- Dense action areas should use `ToolbarRow`.
- Search/filter surfaces should use `SearchToolbar` or matching `InputGroup` composition.
- Repeated content should live inside `SurfaceCard` or another design-system primitive.

## Responsiveness

- Mobile: single column, full-width controls, no horizontal scroll in primary workflows.
- Tablet: allow two-column supporting layouts when it improves scanability.
- Desktop: use wider shells and split-panel composition where appropriate.

## Implementation Bias

When in doubt, simplify:

- fewer colors
- fewer effects
- clearer spacing
- more reuse

The correct direction is almost always quieter, more semantic, and more compositional.
