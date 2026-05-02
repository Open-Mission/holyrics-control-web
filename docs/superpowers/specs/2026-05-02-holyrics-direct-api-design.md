# Direct Holyrics API Migration

## Goal

Replace the current frontend integration that depends on the intermediate control server with a direct integration against the Holyrics API.

The new implementation must:

- keep the existing multi-server experience
- simplify each server definition to `name + url`
- keep authentication isolated per server through a stored token
- support both local network and internet request flows
- prioritize the local network flow as the default and most reliable path
- preserve React Query for cache orchestration and Zod for request and response validation
- replace the Orval-generated app-facing API surface with a new semantic API organized by domain

## Product Decision

Use a semantic facade plus a generic direct Holyrics client.

The app will stop importing runtime hooks and fetchers from `@/api/generated`. Instead, it will consume a new API surface under `@/api/holyrics`, organized into focused modules such as `songs`, `presentation`, `playlists`, `themes`, `system`, `services`, and `auth`.

This keeps the transport logic centralized while making the app imports clearer and easier to maintain.

## Non-Goals

- Keeping compatibility with the old Orval naming scheme.
- Continuing to depend on the intermediate control server for runtime requests.
- Recreating the full OpenAPI-generated structure manually.
- Expanding the current product scope beyond what is required for the direct migration.

## Existing State

Today the app relies on:

- a multi-server registry with `name + serverUrl + holyricsUrl`
- a runtime client in `src/lib/holyrics-instance.ts` that points requests to the intermediate control server
- a stable barrel in `src/api/generated.ts` that re-exports Orval output
- direct imports of generated hooks and fetchers across routes, components, stores, and setup flows

This creates two problems for the new direction:

1. The server model no longer matches the desired direct Holyrics integration.
2. The app-facing API surface is coupled to generated names that reflect the old transport model rather than the Holyrics action model.

## New Server Model

### Registry

Each server record should contain:

- `id`
- `name`
- `url`
- `createdAt`
- `updatedAt`
- optional `lastConnectedAt`

The existing `serverUrl` and `holyricsUrl` fields will be removed from the canonical runtime model.

### Per-Server Auth State

Authentication remains isolated per server in local storage.

Base auth state:

- `token`

Optional local hash session state:

- `sid`
- `nonce`
- `rid`
- `authenticatedAt`

The token remains the source of truth for both local and internet modes. The hash session is a derived optimization used only for the local flow when needed.

## Transport Strategy

### Local Network

Primary request mode:

- `POST {url}/api/{action}?token={token}`

Optional secure local mode:

- `POST {url}/api/{action}?sid={sid}&rid={rid}&dtoken={hash}`

Rules:

- local mode is the default priority
- requests use `Content-Type: application/json`
- payloads are posted as JSON objects
- the token is required for all protected actions
- if hash mode is used, the client must manage `Auth`, `sid`, `nonce`, and monotonically increasing `rid`

### Local Auth Handshake

To authenticate using hash mode:

1. Call `Auth` without auth parameters to obtain `sid` and `nonce`.
2. Compute `dtoken = sha256(nonce + ':' + rid + ':' + token + ':' + data)`.
3. Call `Auth` again with `rid=0` and body `auth`.
4. Use the resulting session for subsequent requests.

The app should still support simple token mode first because it is the lowest-complexity and most important path for this migration.

### Internet

Internet requests will be supported through the URL stored in the server definition. The server record does not need a separate internet field because the transport mode is determined by the URL and endpoint shape.

Expected request styles:

- `POST https://api.holyrics.com.br/request/{action}`
- `POST https://api.holyrics.com.br/send/{action}`

Headers:

- `Content-Type: application/json`
- `api_key: ...`
- `token: ...`

The direct internet flow has a different response envelope and must be normalized by the base client before data reaches the rest of the app.

## Runtime Client Architecture

Create a new `src/api/holyrics/core/` layer.

### `client.ts`

Responsibilities:

- resolve the active server
- fail clearly if no active server is configured
- infer transport mode from the current server URL
- send action-based requests to Holyrics
- normalize local and internet envelopes into one app-level result shape
- convert transport and Holyrics API errors into consistent frontend errors

### `auth.ts`

Responsibilities:

- manage token-based direct local calls
- manage optional local `Auth` nonce flow
- persist or refresh `sid`, `nonce`, and `rid` per server
- expose helpers for request signing when hash mode is used

### `schemas.ts`

Responsibilities:

- define common Zod schemas for:
  - local response envelope
  - internet response envelope
  - app-normalized error objects
  - auth session state

### `query.ts`

Responsibilities:

- centralize query key creation
- standardize query and mutation wrappers
- make cache keys clearly scoped by active server and module

## API Surface

Create a new semantic API under `src/api/holyrics/`.

### Public structure

- `src/api/holyrics/index.ts`
- `src/api/holyrics/modules/auth.ts`
- `src/api/holyrics/modules/system.ts`
- `src/api/holyrics/modules/songs.ts`
- `src/api/holyrics/modules/presentation.ts`
- `src/api/holyrics/modules/themes.ts`
- `src/api/holyrics/modules/playlists.ts`
- `src/api/holyrics/modules/services.ts`

### Module contract

Each module should expose:

- direct async functions with semantic names
- React Query hooks for read and write flows
- Zod-validated input and output parsing

Examples:

- `listSongs`
- `useSongsQuery`
- `getSong`
- `showSong`
- `getCurrentPresentation`
- `useCurrentPresentationQuery`
- `listThemes`
- `setCurrentTheme`
- `listSavedPlaylists`
- `loadSavedPlaylist`

## Validation Strategy

Use Zod at the direct integration boundary.

Rules:

- validate inputs before request dispatch where practical
- validate Holyrics envelopes before exposing data to consumers
- validate module-level payloads that are used repeatedly by the app
- do not try to model every Holyrics action upfront if the app does not consume it yet

The migration should start with the subset already used by the app and expand only as needed.

## React Query Strategy

React Query remains the query and mutation coordination layer.

Rules:

- query keys must be server-aware
- server switching must invalidate or clear active query caches
- direct fetch functions should be pure and reusable by both hooks and stores
- mutations should invalidate the smallest possible semantic key sets

The root runtime coordinator can keep the current behavior of clearing the query cache on server switch, but the new query keys should still include server context so future narrowing remains straightforward.

## Storage And Context Migration

### Registry migration

Existing registry entries with:

- `serverUrl`
- `holyricsUrl`

should be migrated to:

- `url`

Migration rule:

- prefer `holyricsUrl` as the new direct Holyrics URL if present
- otherwise fall back to `serverUrl`

This preserves the closest existing runtime target for the new direct client.

### Auth migration

Per-server auth storage should remain under the same namespace when possible, but the structure should be extended to support local hash session data.

Old state:

- `token`

New state:

- `token`
- optional `sid`
- optional `nonce`
- optional `rid`
- optional `authenticatedAt`

## Runtime resolution

Any code that previously resolved:

- control server URL
- Holyrics URL
- generated transport helpers

must be updated to resolve only the active direct Holyrics server URL.

## Module Mapping For Current App Usage

The first migration wave must cover the actions already used by the app.

### Auth and system

- `GetTokenInfo`
- `CheckPermissions`
- `GetGlobalSettings`
- `GetAPIServerInfo` if still needed by dashboards
- local `Auth` handshake helpers

### Songs

- `GetSongs`
- `GetSong`
- `SearchSong`
- `ShowSong`
- `SetRealTimeSongKey` if still used

### Presentation

- `GetCurrentPresentation`
- `CloseCurrentPresentation`
- `ActionNext`
- `ActionPrevious`
- `ActionGoToIndex`
- `ActionGoToSlideDescription`
- `GetF8`
- `GetF9`
- `GetF10`
- `SetF8`
- `SetF9`
- `SetF10`
- `GetCurrentBackground`
- `GetCurrentTheme`
- `SetCurrentBackground`

### Themes

- `GetThemes`
- `SetCurrentBackground`
- `SetBibleSettings` or the specific Bible theme operation currently used by the app

### Playlists

- `GetSavedPlaylists`
- `LoadSavedPlaylist`
- `GetSongPlaylist`
- `GetMediaPlaylist`

### Services and schedules

- `GetCurrentSchedule`
- `GetSchedules`
- `SetCurrentSchedule`
- any supporting action needed to present items from the current service flow

## File Impact Inventory

### Core integration

- `src/lib/server-registry.ts`
- `src/lib/server-storage.ts`
- `src/lib/holyrics-instance.ts`
- `src/lib/holyrics.ts`
- `src/lib/global-settings.ts`
- `src/api/generated.ts`

### New API implementation

- `src/api/holyrics/core/client.ts`
- `src/api/holyrics/core/auth.ts`
- `src/api/holyrics/core/schemas.ts`
- `src/api/holyrics/core/query.ts`
- `src/api/holyrics/modules/auth.ts`
- `src/api/holyrics/modules/system.ts`
- `src/api/holyrics/modules/songs.ts`
- `src/api/holyrics/modules/presentation.ts`
- `src/api/holyrics/modules/themes.ts`
- `src/api/holyrics/modules/playlists.ts`
- `src/api/holyrics/modules/services.ts`
- `src/api/holyrics/index.ts`

### Server and auth UI

- `src/components/settings/server-settings.tsx`
- `src/components/onboarding/server-onboarding-card.tsx`
- `src/components/settings/auth-settings.tsx`
- `src/components/settings/system-settings.tsx`
- `src/components/settings/connection-status-card.tsx`
- `src/components/dashboard/projection-preview.tsx`

### Routes and components that import generated API

- `src/routes/service.tsx`
- `src/routes/themes.tsx`
- `src/routes/playlists.tsx`
- `src/components/dashboard/recent-activities.tsx`
- `src/components/dashboard/projection-preview.tsx`
- `src/components/presentation-sync.tsx`
- `src/components/service/service-list.tsx`
- `src/components/service/service-item.tsx`
- `src/components/service/service-group.tsx`

### Stores

- `src/hooks/use-songs-store.ts`
- `src/hooks/use-themes-store.ts`
- `src/hooks/use-playlists-store.ts`

### App runtime coordination

- `src/routes/__root.tsx`

### Generated code to retire from runtime usage

- `src/api/endpoints/**`
- `src/api/zod.ts`

## Implementation Sequence

1. Migrate the server record model from `serverUrl + holyricsUrl` to `url`.
2. Extend per-server auth storage to support token plus optional local hash session state.
3. Implement the direct Holyrics core client with local token mode first.
4. Add optional local hash authentication support.
5. Add internet request normalization support.
6. Build semantic domain modules under `src/api/holyrics/`.
7. Repoint app stores to the new semantic fetch functions.
8. Repoint routes and components from `@/api/generated` to the new modules.
9. Remove runtime dependence on `src/lib/holyrics-instance.ts` and generated Orval exports.
10. Keep generated files only until all runtime imports are removed, then retire them from the active architecture.

## Risks

- Some current route behavior still assumes backend-shaped payloads rather than native Holyrics payloads.
- The current app may rely on generated query key shapes that will change during migration.
- Internet mode requires correct handling of a different envelope and possibly deployment-specific URL choices.
- The action currently used for Bible theme updates should be verified during implementation to avoid semantic drift.

## Testing Strategy

Minimum verification should cover:

- migration of legacy server records to the new `url` model
- creation and editing of servers with `name + url + token`
- isolated auth state per server
- local token-based requests
- local hash-based requests
- internet request normalization
- global settings refresh after server switch
- songs sync, themes sync, and playlists sync using the new direct client
- service route fetches and schedule switching
- presentation status sync and theme application flows
- React Query cache behavior after server switch

## Decision Summary

The app will fully move away from the Orval-generated runtime surface and intermediate server transport.

The replacement architecture is:

- multi-server records simplified to `name + url`
- per-server token auth retained
- local direct Holyrics requests as the primary path
- internet requests supported through the same server model
- new semantic API modules under `src/api/holyrics`
- React Query and Zod preserved as core frontend infrastructure
