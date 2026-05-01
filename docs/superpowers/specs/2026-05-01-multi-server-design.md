# Multi-Server Support For Holyrics Control Web

## Goal

Add local multi-server support to the app so an operator can register multiple Holyrics environments, switch between them from a tenant-style dropdown, and keep all relevant state isolated per server.

The primary use case is switching safely between environments such as test and production without mixing authentication, cached settings, or offline synced data.

## Non-Goals

- Adding backend support for multi-tenancy.
- Syncing server definitions across devices or users.
- Introducing user accounts or permission models.
- Reworking the entire application navigation beyond the server switcher and settings/onboarding surfaces required for this feature.

## Product Requirements

The feature must support:

- Registering multiple servers with `Name`, `Server URL`, and `Holyrics URL`.
- Managing servers after onboarding from `Configurações`.
- Selecting the active server from a global dropdown in the app header.
- Contextualizing the whole app by active server.
- Keeping authentication, setup progress, global settings, and offline caches isolated per server.
- Removing a server together with its local auth and cached data.

## Existing Constraints

- The app currently resolves API traffic from a single `HOLYRICS_SERVER_URL` local storage entry or environment fallback.
- Cached `global settings` are currently global rather than per server.
- Offline data and setup state already exist locally and must not be mixed between environments.
- The project already has onboarding and settings flows that should be extended instead of replaced.

## Recommended Approach

Implement a local `server registry` plus an `active server context`.

The registry stores all configured servers and the currently selected server id. The active context becomes the single source of truth for:

- the control server URL used by API requests
- the Holyrics URL used by features that depend on it
- authentication state
- setup completion state
- cached global settings
- offline synced data

This approach fits the current frontend architecture, keeps the implementation local to the app, and fully satisfies the isolation requirement.

## Data Model

### Server Registry

Persist a top-level record in local storage:

- `holyrics:servers`
- `holyrics:active-server-id`

Each server record should contain:

- `id`
- `name`
- `serverUrl`
- `holyricsUrl`
- `createdAt`
- `updatedAt`
- optional lightweight metadata such as `lastConnectedAt`

### Per-Server Namespaces

All contextual data must move to namespaced storage keys:

- `holyrics:server:<id>:auth`
- `holyrics:server:<id>:global-settings`
- `holyrics:server:<id>:setup`
- `holyrics:server:<id>:songs`
- `holyrics:server:<id>:themes`
- `holyrics:server:<id>:playlists`

If the IndexedDB layer already stores songs, themes, or playlists outside local storage, it must still gain a server-aware namespace so records are isolated by server id.

## Runtime Architecture

### Active Server Store

Add a small server-focused store or context that:

- loads the registry
- resolves the active server
- switches the active server
- creates, updates, and removes server records
- exposes whether onboarding is required

This store should be the only layer allowed to decide what the current server is.

### API Client Resolution

Replace direct reads of `HOLYRICS_SERVER_URL` from generic local storage with active-server resolution.

The request client must:

- read the currently active server URL
- normalize trailing slashes
- fail clearly when no active server exists

Any route or helper that currently imports a static server URL constant for runtime usage should be updated to resolve from the active context instead.

### React Query And Store Rehydration

When the active server changes, the app must:

- update the active server id
- invalidate or reset relevant React Query caches
- rehydrate server-scoped local stores
- refresh connection status and auth state in the new context
- keep previous server data untouched

This must be treated as a context switch, not a partial refresh.

## UX Design

### Onboarding

The first-time flow must add a server registration step before the existing sync/setup experience.

The first server form collects:

- `Nome`
- `Server URL`
- `Holyrics URL`

After saving the first server, it becomes active immediately and the current onboarding flow continues in that context.

If the user removes the last remaining server later, the app returns to onboarding.

### Global Header Switcher

Add a tenant-style dropdown menu to the header showing the active server.

The switcher should:

- display the server name
- make the current context obvious
- allow switching to another server quickly
- expose a shortcut to `Gerenciar servidores`

The app shell must visually reflect the selected server context without introducing noisy branding or route-specific styling.

### Settings Management

Add a `Servidores` tab to `Configurações`.

This tab should allow:

- listing all registered servers
- creating a new server
- editing an existing server
- removing a server
- activating a server

Removal behavior:

- removing a server deletes its auth, setup state, cached global settings, and offline data
- removing the active server is allowed
- if another server remains, the app should promote a sensible fallback active server
- if none remain, the app returns to onboarding

## Contextual Behavior

The following parts of the app must become server-aware:

- connection status
- authentication settings
- system settings that depend on server communication
- preferences/global settings cache
- setup wizard progress
- songs sync and offline read model
- themes sync and offline read model
- playlists sync and offline read model

Any status, error, or empty state shown in the UI must refer to the active server context implicitly and avoid implying a global app-wide failure.

## Global Settings Refresh Rule

On server switch, the app must attempt to fetch `global settings` from the newly active server immediately.

Behavior:

1. Switch the active server context.
2. Attempt a network fetch for that server's `global settings`.
3. If the fetch succeeds, update both in-memory state and the server-scoped persisted cache.
4. If the fetch fails, keep and use the last saved `global settings` snapshot for that server.

This gives fresh settings whenever the target server is reachable without making the UI fragile when it is temporarily offline.

The same fallback behavior applies when entering screens that rely on cached settings: prefer fresh data when available, otherwise keep using the latest valid local snapshot from that server.

## Migration Strategy

Existing single-server installs must be migrated automatically on first load of the new version.

Migration rules:

- if the old single-server storage exists, create one server record from it
- assign a default migrated name such as `Servidor atual`
- copy the old server URL into the new server record
- move old auth and cached data into that server's namespace
- set the migrated server as active

The migration should be idempotent and safe to re-run if partially completed.

If no old config exists, the app starts directly in onboarding.

## Error Handling

- A broken or offline server must not break access to other configured servers.
- Switching to an unhealthy server should still complete the context switch even if some network refreshes fail.
- Errors must remain scoped to the active server and should guide the user back to settings or auth when relevant.
- Forms for server registration and editing should validate URL fields before persistence.

## Testing

Implementation verification should cover:

- storage migration from legacy single-server state
- creating the first server in onboarding
- CRUD operations for servers in settings
- switching active server and rehydrating server-scoped state
- fetching fresh `global settings` on switch with fallback to the cached snapshot on failure
- isolated auth state per server
- isolated songs, themes, playlists, and setup progress per server
- removing a server and cleaning its local data
- fallback behavior when the active server is removed

## Risks

- The current code reads server configuration from more than one place, so all runtime resolution points must be consolidated carefully.
- Existing offline stores may require schema or key changes to become server-aware.
- Partial migration could cause mixed data if old global keys are not retired after successful import.

## Decision Summary

The implementation will:

- add a local registry for multiple servers
- introduce an active server context used by the entire app
- extend onboarding for first-server creation
- add a global header switcher and a `Servidores` settings tab
- isolate auth, setup, global settings, and offline caches per server
- refresh `global settings` on server switch with cached fallback when the network request fails
