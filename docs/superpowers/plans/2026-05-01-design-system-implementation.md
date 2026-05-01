# Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved design system, add `/design` as the canonical showcase, migrate the main app surfaces to it, and add a project skill that keeps future UI work aligned.

**Architecture:** Extend the existing shadcn preset through semantic app-level CSS and a small layer of composition primitives under `src/components/design-system/`. Use those primitives to refactor the root shell and key routes without changing their business behavior. Document the system in a first-class route and codify it in a local skill.

**Tech Stack:** Vite, React 19, TanStack Router, shadcn/ui (`radix-vega`), Tailwind v4, TypeScript

---

### Task 1: Foundation And File Map

**Files:**
- Modify: `src/index.css`
- Create: `src/components/design-system/*.tsx`
- Create: `docs/superpowers/plans/2026-05-01-design-system-implementation.md`

- [ ] Add app-level CSS variables and base layout classes that extend, but do not replace, the shadcn theme.
- [ ] Create focused composition primitives for shell, headers, sections, surfaces, metrics, status chips, and search/toolbars.
- [ ] Keep all primitives thin wrappers over existing shadcn components and semantic tokens.

### Task 2: `/design` Reference Route

**Files:**
- Create: `src/routes/design.tsx`
- Reuse: `src/components/design-system/*.tsx`

- [ ] Build a route that demonstrates the foundations, primitives, and product section patterns.
- [ ] Ensure examples cover mobile, tablet, and desktop behavior through responsive layouts rather than static screenshots.
- [ ] Keep the route readable as documentation and useful as a copy source for future screens.

### Task 3: Root Shell And Sidebar

**Files:**
- Modify: `src/routes/__root.tsx`
- Modify: `src/components/app-sidebar.tsx`

- [ ] Refactor the app shell and top bar to use the new primitives.
- [ ] Replace ad hoc header badge styling with semantic surface/status patterns where practical.
- [ ] Keep current routing and sidebar behavior intact.

### Task 4: Dashboard And Primary Content Screens

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/dashboard/*.tsx`
- Modify: `src/routes/songs.tsx`
- Modify: `src/routes/playlists.tsx`
- Modify: `src/routes/service.tsx`
- Modify: `src/routes/settings.tsx`

- [ ] Refactor dashboard sections to use page headers, metric cards, and split panels.
- [ ] Replace raw search inputs, manual pills, and hand-rolled alert/empty patterns on content screens with standardized composition.
- [ ] Preserve all existing query, filtering, scheduling, and pagination behavior.

### Task 5: Design System Preservation Skill

**Files:**
- Create: `.agents/skills/holyrics-design-system/SKILL.md`

- [ ] Write a local skill that triggers for future UI/design work in this repo.
- [ ] Encode the visual direction, required primitives, responsive rules, and prohibited styling shortcuts.
- [ ] Point future sessions to `/design` as the canonical visual reference.

### Task 6: Verification

**Files:**
- Verify all files above

- [ ] Run `pnpm build` or the nearest equivalent available in the workspace.
- [ ] Confirm the route tree still compiles with the new `/design` route.
- [ ] Review diffs for accidental style drift or overlap with unrelated dirty worktree changes.
