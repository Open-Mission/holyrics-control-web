# PWA Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app installable as a mobile PWA, cache the app shell for offline startup, and add a global Holyrics connectivity/notification layer that works on local networks without internet.

**Architecture:** Add `vite-plugin-pwa` for manifest and service worker generation, register the worker from the app entrypoint, then introduce a small client-side connectivity store that polls Holyrics reachability separately from browser online status. Surface that runtime state through a compact global banner and the existing settings card, and trigger local notifications on meaningful state transitions.

**Tech Stack:** Vite, React, TypeScript, TanStack Router, service workers, Notification API, IndexedDB, localStorage

---

## File Map

- `package.json`
  Add the PWA plugin dependency.
- `vite.config.ts`
  Configure manifest, assets, and workbox behavior.
- `src/main.tsx`
  Register the service worker.
- `public/*`
  Provide install icons and related static PWA assets.
- `src/lib/pwa.ts`
  Centralize service worker registration.
- `src/lib/notifications.ts`
  Centralize notification permission and display helpers.
- `src/hooks/use-holyrics-connection.ts`
  Global connectivity state and polling loop.
- `src/components/settings/connection-status-card.tsx`
  Repoint settings UI to the new runtime connectivity state.
- `src/components/holyrics-runtime-banner.tsx`
  Add a compact app-level offline/connectivity banner.
- `src/routes/__root.tsx`
  Mount the connectivity runtime and banner.
- `src/hooks/use-presentation-store.ts`
  Trigger a local notification on successful presentation start.

## Task 1: Add the PWA build infrastructure

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/lib/pwa.ts`
- Modify: `src/main.tsx`
- Create/Modify: `public/*`

- [ ] Add `vite-plugin-pwa` and configure the manifest, standalone display mode, theme colors, icons, and app-shell caching.
- [ ] Register the generated service worker from the app entrypoint.
- [ ] Provide install-sized icon assets that match the existing product branding.

## Task 2: Build the runtime connectivity and notification layer

**Files:**
- Create: `src/lib/notifications.ts`
- Create: `src/hooks/use-holyrics-connection.ts`
- Modify: `src/hooks/use-presentation-store.ts`

- [ ] Create notification helpers for permission reads, explicit permission requests, and local notification display.
- [ ] Poll Holyrics reachability on an interval, scoped to the active server, and track last successful contact plus browser online state.
- [ ] Trigger notifications on disconnect, reconnect, and successful presentation start.

## Task 3: Surface the state in the app shell

**Files:**
- Create: `src/components/holyrics-runtime-banner.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/components/settings/connection-status-card.tsx`

- [ ] Add a compact global banner for offline and Holyrics-unreachable states.
- [ ] Add an explicit “enable notifications” action when permission is not granted.
- [ ] Reuse the same runtime state in settings so the app has one connectivity truth.

## Task 4: Verify integration

**Files:**
- Test: `pnpm lint`
- Test: `pnpm build`

- [ ] Run lint and fix any type or style regressions.
- [ ] Run the production build and confirm the PWA assets and service worker compile cleanly.

## Self-Review

- Spec coverage:
  - installable PWA: Task 1
  - offline shell: Task 1
  - local persistence reuse: preserved by existing stores; no conflicting cache layer added
  - connectivity distinction: Tasks 2 and 3
  - local notifications: Tasks 2 and 3
- Placeholder scan:
  - no deferred or undefined implementation areas remain in the plan
- Type consistency:
  - `use-holyrics-connection.ts` is the single runtime status source for both header and settings

## Execution

The user approved the design direction and explicitly asked to proceed, so execution continues inline in this session.
