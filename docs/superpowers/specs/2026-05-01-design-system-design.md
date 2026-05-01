# Design System For Holyrics Control Web

## Goal

Establish a consistent design system for the existing Vite + TanStack Router application using the project's configured shadcn/ui foundation (`radix-vega`, `neutral` base, `cyan` theme, `Geist` font). The result must be minimal, elegant, and responsive across mobile, tablet, and desktop.

The work includes:

- A canonical `/design` route that showcases the system's tokens, components, and section patterns.
- A first migration pass of the main app surfaces so the application starts using the same visual language immediately.
- A project skill that teaches future sessions to preserve this design system instead of drifting back into ad hoc styling.

## Non-Goals

- Replacing the shadcn preset or changing the base theme colors.
- Rebuilding every route in the app in one pass.
- Creating a separate package or external design token pipeline.
- Introducing heavy brand art direction that fights the existing shadcn setup.

## Existing Constraints

- The project already uses shadcn/ui with `radix-vega`, Tailwind v4, CSS variables, and `lucide-react`.
- Many UI primitives already exist under `src/components/ui`.
- Several app screens currently mix good shadcn composition with one-off styling, manual form markup, raw `input` fields, and hard-coded visual treatments.
- The repository is dirty, so implementation must avoid reverting or trampling unrelated user changes.

## Visual Direction

The system should feel calm, precise, and premium without becoming ornamental.

- Use the existing semantic tokens (`background`, `card`, `muted`, `primary`, `border`, `sidebar`, etc.) as the source of truth.
- Add only a small set of app-level semantic aliases for layout rhythm and surface treatment when necessary.
- Favor restraint: soft contrast, deliberate spacing, subtle depth, sharp typography hierarchy, and minimal accent use.
- Let emphasis come from composition and density rather than custom color overrides.

## Design Principles

1. Compose from shadcn first.
2. Use semantic tokens, never hard-coded palette classes for product UI.
3. Keep `className` focused on layout and structure, not component recoloring.
4. Prefer repeatable section patterns over route-specific one-off containers.
5. Mobile is the default layout; tablet and desktop progressively add columns and density.
6. Every new screen should be explainable as a composition of a few reusable patterns.

## System Layers

### 1. Foundation

Update `src/index.css` to define the app's design vocabulary while preserving the current shadcn palette:

- page spacing scale
- container widths
- surface elevation treatments
- section spacing
- headline rhythm
- subtle decorative background treatment compatible with light and dark modes

This is not a palette rewrite. It is a small semantic extension on top of the preset.

### 2. App-Level Primitives

Create a focused set of reusable UI building blocks under `src/components/design-system/`:

- `app-shell`
- `page-header`
- `section-block`
- `surface-card`
- `metric-card`
- `status-chip`
- `toolbar-row`
- `search-toolbar`
- `empty-state-section`
- `split-panel-section`

These components should wrap existing shadcn primitives instead of replacing them. They exist to standardize layout, spacing, composition, and repeated page structure.

### 3. Section Patterns

Build reusable section examples that represent the app's recurring needs:

- dashboard hero and metrics
- searchable content list
- filter/action toolbar
- two-column content section
- schedule/service section
- configuration workspace with tabs and status summary
- preview/media section

These patterns should be demonstrated in `/design` and then reused in real routes.

## `/design` Route

Add a dedicated route named `/design` that acts as the design system source of truth.

It should include:

- Intro section explaining the design intent.
- Theme snapshot: backgrounds, surfaces, borders, accents, typography levels.
- Component section: buttons, badges, inputs, tabs, cards, alerts, empty states, separators.
- Product primitives section: page headers, toolbars, metric cards, section shells, status chips.
- Section patterns section: dashboard, searchable list, schedule panel, settings workspace, preview panel.
- Responsive examples showing how sections stack on mobile and expand on larger breakpoints.

This page is documentation for humans and a reference implementation for future code changes.

## First Migration Pass

Apply the system to the routes that most strongly define the product experience.

### `src/routes/__root.tsx`

- Align the top bar with the new shell primitives.
- Replace ad hoc badge styling where possible with semantic patterns.
- Keep the sidebar/layout behavior intact.

### `src/components/app-sidebar.tsx`

- Refine branding, grouping, and footer action styling to match the new system.
- Preserve current navigation structure.

### `src/routes/index.tsx` and dashboard components

- Rebuild the dashboard using the new page header, metric, surface, and split-section patterns.
- Remove hard-coded dark visual styling that bypasses theme tokens.

### `src/routes/songs.tsx`

- Replace raw search input and manual pills/error blocks with standardized primitives.
- Keep existing interaction behavior and pagination logic.

### `src/routes/playlists.tsx`

- Apply the same searchable-content pattern used for songs.
- Align playlist cards and action affordances to the system.

### `src/routes/service.tsx`

- Normalize toolbar, tabs, and surface layout.
- Preserve all current scheduling behavior and filtering.

### `src/routes/settings.tsx`

- Standardize page header and tabs shell to the system.
- Keep internal settings components intact unless a local fix is required for consistency.

## Skill

Create a project-local skill under the repo's agent skills area that instructs future sessions to preserve the design system.

The skill should define:

- when it should trigger
- the project's visual direction
- required use of shadcn semantic tokens
- required use of the app-level primitives and section patterns before inventing new markup
- responsive behavior expectations
- prohibited patterns such as raw hard-coded color styling, manual form layout when field primitives exist, and route-local design reinvention
- expectation that `/design` is the canonical showcase and reference

The skill should be concise enough to trigger reliably but specific enough to prevent drift.

## File Plan

- `src/index.css`
- `src/routes/design.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/songs.tsx`
- `src/routes/playlists.tsx`
- `src/routes/service.tsx`
- `src/routes/settings.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/dashboard/*` as needed
- new files under `src/components/design-system/`
- new project skill under `.agents/skills/`

## Responsive Behavior

- Mobile: stacked sections, compact toolbars, full-width controls, single-column surfaces.
- Tablet: selective two-column layouts for metrics and supporting panels.
- Desktop: wider shells, split layouts for dashboard and service views, more persistent side-by-side composition.

No route should require horizontal scrolling for its primary workflow.

## Accessibility

- Preserve semantics from shadcn primitives.
- Maintain sufficient contrast via existing semantic tokens.
- Ensure interactive sections keep visible focus treatment.
- Keep headings and landmarks clear on the `/design` page so it is navigable as documentation.

## Testing

Implementation verification should include:

- typecheck/build
- route-level smoke verification for `/design`, `/`, `/songs`, `/playlists`, `/service`, `/settings`
- manual sanity check for mobile/tablet/desktop layouts where practical

If visual browser validation is available later, use it after implementation. It is not required to finalize the spec.

## Risks

- Existing dirty files may overlap with route work and require careful merging.
- Some current route components may contain styling assumptions that need targeted cleanup before they fit the system cleanly.
- Over-abstracting primitives too early would slow the migration; the component set should stay intentionally small.

## Decision Summary

The implementation will follow the recommended approach:

- establish a semantic shell and section system
- build `/design` as the canonical reference
- migrate the app's main routes to those patterns
- add a persistent project skill so future work continues to respect the system
