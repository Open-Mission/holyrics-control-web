# Holyrics Direct API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the runtime dependency on the intermediate control server and move the app to a direct Holyrics API client with multi-server support based on `name + url + token`.

**Architecture:** Introduce a direct action-based Holyrics client in `src/api/holyrics`, normalize local and internet response envelopes there, then repoint existing routes, stores, and settings flows from generated Orval symbols to the new semantic surface. Keep React Query for cache orchestration and Zod for transport validation, while preserving per-server auth and offline caches.

**Tech Stack:** Vite, React, TypeScript, TanStack React Query, Zod, localStorage, IndexedDB

---

## File Map

- `src/lib/server-registry.ts`
  Migrates the server model from `serverUrl + holyricsUrl` to `url`.
- `src/lib/server-storage.ts`
  Expands per-server auth storage and keeps URL normalization helpers.
- `src/api/holyrics/core/client.ts`
  Direct Holyrics request dispatcher and envelope normalization.
- `src/api/holyrics/core/auth.ts`
  Token and local hash-session helpers.
- `src/api/holyrics/core/schemas.ts`
  Zod envelopes and reusable parsers.
- `src/api/holyrics/core/query.ts`
  Query key helpers and shared QueryClient accessors.
- `src/api/holyrics/modules/*.ts`
  Semantic domain APIs for auth, system, songs, playlists, themes, presentation, and services.
- `src/api/holyrics/index.ts`
  Public barrel for the new semantic runtime API.
- `src/lib/holyrics.ts`
  Temporary compat surface that re-exports the new semantic API for existing callers while imports are being migrated.
- `src/components/settings/*.tsx`
  Server, auth, preferences, system status, and connection surfaces.
- `src/components/dashboard/*.tsx`
  Dashboard readers for schedule and API server info.
- `src/components/service/*.tsx`
  Service list, item actions, and types.
- `src/hooks/use-*.ts`
  Store fetchers and presentation helpers.
- `src/routes/service.tsx`
  Service schedule and schedule switching.
- `src/routes/themes.tsx`
  Theme list and theme application.
- `src/routes/playlists.tsx`
  Saved playlists and load action.

### Task 1: Create the new direct Holyrics core

**Files:**
- Create: `src/api/holyrics/core/schemas.ts`
- Create: `src/api/holyrics/core/auth.ts`
- Create: `src/api/holyrics/core/client.ts`
- Create: `src/api/holyrics/core/query.ts`

- [ ] Define shared Zod schemas for local envelopes, internet envelopes, auth session state, and normalized errors.
- [ ] Implement direct request helpers that resolve the active server, select local or internet transport, and normalize `status/data/error`.
- [ ] Implement local auth helpers for token mode and optional hash-session support.
- [ ] Add query key helpers that always include the active server context.

### Task 2: Replace the runtime server model

**Files:**
- Modify: `src/lib/server-registry.ts`
- Modify: `src/lib/server-storage.ts`
- Test: `pnpm build`

- [ ] Change `ServerRecord` and `ServerInput` to use `url` instead of `serverUrl` and `holyricsUrl`.
- [ ] Migrate legacy registry records by preferring `holyricsUrl`, falling back to `serverUrl`.
- [ ] Extend auth storage to support `sid`, `nonce`, `rid`, and `authenticatedAt`.
- [ ] Verify TypeScript catches every remaining access to removed fields.

### Task 3: Build semantic API modules

**Files:**
- Create: `src/api/holyrics/modules/auth.ts`
- Create: `src/api/holyrics/modules/system.ts`
- Create: `src/api/holyrics/modules/songs.ts`
- Create: `src/api/holyrics/modules/presentation.ts`
- Create: `src/api/holyrics/modules/themes.ts`
- Create: `src/api/holyrics/modules/playlists.ts`
- Create: `src/api/holyrics/modules/services.ts`
- Create: `src/api/holyrics/index.ts`

- [ ] Add semantic functions for every action already used by the app.
- [ ] Add React Query hooks only where the app currently depends on query semantics.
- [ ] Keep module-level types focused on app usage instead of trying to model the whole API upfront.
- [ ] Re-export the new surface from `src/api/holyrics/index.ts`.

### Task 4: Repoint compatibility helpers and stores

**Files:**
- Modify: `src/lib/holyrics.ts`
- Modify: `src/lib/global-settings.ts`
- Modify: `src/hooks/use-songs-store.ts`
- Modify: `src/hooks/use-song-detail.ts`
- Modify: `src/hooks/use-themes-store.ts`
- Modify: `src/hooks/use-playlists-store.ts`
- Modify: `src/hooks/use-presentation-store.ts`

- [ ] Rewire `src/lib/holyrics.ts` to the new semantic modules so legacy imports stop touching Orval runtime code.
- [ ] Repoint song, theme, playlist, global settings, and presentation helpers to direct Holyrics fetchers and mutations.
- [ ] Preserve current IndexedDB shapes and server-scoped cache behavior.

### Task 5: Repoint routes and components from generated API

**Files:**
- Modify: `src/components/settings/auth-settings.tsx`
- Modify: `src/components/settings/preferences-settings.tsx`
- Modify: `src/components/settings/system-settings.tsx`
- Modify: `src/components/settings/connection-status-card.tsx`
- Modify: `src/components/dashboard/projection-preview.tsx`
- Modify: `src/components/dashboard/recent-activities.tsx`
- Modify: `src/components/presentation-sync.tsx`
- Modify: `src/components/service/service-item.tsx`
- Modify: `src/components/service/service-list.tsx`
- Modify: `src/components/service/service-group.tsx`
- Modify: `src/routes/service.tsx`
- Modify: `src/routes/themes.tsx`
- Modify: `src/routes/playlists.tsx`

- [ ] Replace generated hooks and types with semantic modules and local types.
- [ ] Update the projection preview to derive its base URL from the new server model.
- [ ] Keep behavior identical where possible while adapting to native Holyrics envelopes.

### Task 6: Remove generated runtime dependence and verify

**Files:**
- Modify: `src/api/generated.ts`
- Modify: `src/routes/__root.tsx`
- Test: `pnpm lint`
- Test: `pnpm build`

- [ ] Ensure no runtime imports remain from `@/api/generated` or the old Orval-based compat layer.
- [ ] Keep query cache clearing behavior on server switch.
- [ ] Run lint and build as the required verification for this repository.

## Self-Review

- Spec coverage:
  - direct client: Tasks 1 and 3
  - `name + url + token`: Task 2
  - local and internet support: Tasks 1 and 3
  - React Query and Zod preservation: Tasks 1 and 3
  - route and store migration: Tasks 4 and 5
  - generated runtime retirement: Task 6
- Placeholder scan:
  - no `TBD` or deferred structural placeholders remain
- Type consistency:
  - the plan consistently uses `url` as the server field and `src/api/holyrics` as the new public surface

## Execution

The user already approved the spec and asked to proceed immediately, so execution will continue inline in this session.
