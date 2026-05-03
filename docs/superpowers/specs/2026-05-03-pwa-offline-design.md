# PWA Offline Design

## Goal

Transform the frontend into an installable PWA that remains usable without internet access, as long as the device can render the app shell and read previously synchronized local data.

The app should:

- install on mobile as a standalone app
- boot offline with the cached application shell
- continue reading local `IndexedDB` and `localStorage` data
- fail gracefully when Holyrics-dependent actions cannot reach the active server
- distinguish browser/network availability from Holyrics reachability on the local network
- support local notifications for connectivity transitions and selected in-app events

## Product Decision

Implement an installable PWA shell plus a client-side Holyrics connectivity monitor.

This keeps the scope aligned with the current architecture:

- the UI and routes become available offline through a service worker
- synchronized content already persisted in `IndexedDB` remains readable
- commands that need Holyrics continue using the current request flow and surface errors normally
- notifications are local browser/app notifications, not remote Web Push

## Non-Goals

- Full remote push delivery with the app fully dormant for long periods
- Replay queues for failed Holyrics commands
- Offline mutation sync
- Inventing a backend just for notifications

## Existing State

The project already has the local persistence needed for a useful offline mode:

- `localStorage` stores server registry, auth state, setup flags, and user preferences
- `IndexedDB` stores songs, song details, themes, playlists, and media library caches
- store modules already load from local persistence first and sync against Holyrics on demand

The missing pieces are:

- no manifest or service worker
- no install prompt support
- no app-shell caching
- no global connectivity model for “browser offline vs Holyrics unreachable”
- no notification layer

## Architecture

### PWA Infrastructure

Use `vite-plugin-pwa` to generate:

- `manifest.webmanifest`
- service worker registration
- install metadata and icons

The service worker should cache the app shell and static assets so the app can open without internet. API requests to Holyrics should remain network-bound and should not return stale success responses from cache.

### Connectivity Model

Add a small global runtime layer that tracks:

- browser online status from `navigator.onLine`
- active Holyrics reachability through periodic `GetAPIServerInfo` checks
- last successful Holyrics contact timestamp
- notification permission state

This status becomes the canonical source for:

- header/banner messaging
- settings status cards
- local connectivity notifications

### Notifications

Use the Notification API plus service-worker-backed `showNotification` when available.

Initial supported events:

- Holyrics connection lost
- Holyrics connection restored
- local presentation started from this device

Permission should be requested through an explicit UI action, not automatically on load.

## UX Rules

- If the app shell loads offline, the user should still reach the last synchronized content.
- If Holyrics is unreachable, the UI should explain that local data is available but server actions may fail.
- If notification permission is not granted, the UI should offer a quiet action to enable it.
- Visual treatment should stay inside the existing design system and use semantic tokens.

## Validation

Repository-level verification remains:

- `pnpm lint`
- `pnpm build`

Because the repository does not yet have a committed test runner, behavior validation for this feature will rely on type-safe integration, production build success, and the existing app flows.
