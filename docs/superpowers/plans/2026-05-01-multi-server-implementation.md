# Multi-Server Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local multi-server support with per-server context, onboarding, settings management, isolated auth/cache/setup state, and a global server switcher.

**Architecture:** Introduce a local server registry plus an active-server store that becomes the single runtime source of truth for URLs, auth, setup, and cached data. Migrate legacy single-server storage into the new model, make IndexedDB/meta records server-aware, and rehydrate UI/state whenever the active server changes.

**Tech Stack:** React, TanStack Router, TanStack Query, localStorage, IndexedDB via `idb`, shadcn/ui, TypeScript, Vite

---

## File Structure

### New files

- `src/lib/server-registry.ts`
  - LocalStorage-backed registry, active server helpers, migration helpers, and destructive cleanup helpers.
- `src/hooks/use-server-store.ts`
  - Reactive app-facing store for server list, active server, onboarding gate, and context switch actions.
- `src/components/server/server-switcher.tsx`
  - Header dropdown for switching active server and navigating to settings.
- `src/components/settings/server-settings.tsx`
  - CRUD UI for servers inside the settings route.
- `src/components/onboarding/server-onboarding-card.tsx`
  - First-server creation form for empty installs.
- `src/lib/server-context-events.ts`
  - Tiny event helpers for notifying stores/query reset logic after a server switch.
- `src/lib/server-storage.ts`
  - Shared namespaced key builders for auth, setup, global settings, and per-server cache keys.
- `src/lib/db-server.ts`
  - Helpers for server-aware IndexedDB reads/writes and store cleanup.

### Existing files to modify

- `src/lib/holyrics-instance.ts`
- `src/lib/holyrics.ts`
- `src/lib/global-settings.ts`
- `src/lib/db.ts`
- `src/hooks/use-setup-store.ts`
- `src/hooks/use-songs-store.ts`
- `src/hooks/use-themes-store.ts`
- `src/hooks/use-playlists-store.ts`
- `src/routes/__root.tsx`
- `src/routes/settings.tsx`
- `src/routes/index.tsx`
- `src/routes/themes.tsx`
- `src/components/settings/auth-settings.tsx`
- `src/components/settings/system-settings.tsx`
- `src/components/settings/connection-status-card.tsx`
- `src/components/setup-wizard.tsx`

### Likely tests to add

- `src/lib/server-registry.test.ts`
- `src/lib/global-settings.test.ts`
- `src/hooks/use-setup-store.test.ts`
- `src/hooks/use-songs-store.test.ts`
- `src/hooks/use-themes-store.test.ts`
- `src/hooks/use-playlists-store.test.ts`

These may live elsewhere if the repo already uses another test layout, but the ownership should remain the same.

### Verification commands

- `pnpm test`
- `pnpm build`

If there is no working `pnpm test` script yet, run the narrowest available Vitest command for the new files and always run `pnpm build`.

## Task 1: Build the server registry and legacy migration

**Files:**
- Create: `src/lib/server-storage.ts`
- Create: `src/lib/server-registry.ts`
- Test: `src/lib/server-registry.test.ts`

- [ ] **Step 1: Write the failing registry tests**

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import {
  createServerRecord,
  loadServerRegistry,
  migrateLegacyServerConfig,
  removeServerRecord,
  saveServerRegistry,
  setActiveServerId,
} from '@/lib/server-registry'

describe('server registry', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates and persists multiple servers with an active id', () => {
    const prod = createServerRecord({
      name: 'Produção',
      serverUrl: 'http://prod.local:3000',
      holyricsUrl: 'http://prod.local:8091',
    })

    saveServerRegistry({ servers: [prod], activeServerId: prod.id })

    expect(loadServerRegistry()).toEqual({
      servers: [prod],
      activeServerId: prod.id,
    })
  })

  it('migrates legacy single-server storage into the registry', () => {
    window.localStorage.setItem('HOLYRICS_SERVER_URL', 'http://legacy.local:3000')
    window.localStorage.setItem('holyrics:global-settings', JSON.stringify({ initial_slide: { display_mode: 'keep' } }))

    const migrated = migrateLegacyServerConfig()

    expect(migrated?.servers).toHaveLength(1)
    expect(migrated?.servers[0]?.name).toBe('Servidor atual')
    expect(migrated?.servers[0]?.serverUrl).toBe('http://legacy.local:3000')
    expect(migrated?.activeServerId).toBe(migrated?.servers[0]?.id)
  })

  it('removes a server and promotes another active id when needed', () => {
    const a = createServerRecord({ name: 'Teste', serverUrl: 'http://a:3000', holyricsUrl: 'http://a:8091' })
    const b = createServerRecord({ name: 'Prod', serverUrl: 'http://b:3000', holyricsUrl: 'http://b:8091' })

    saveServerRegistry({ servers: [a, b], activeServerId: a.id })
    const next = removeServerRecord(a.id)

    expect(next.activeServerId).toBe(b.id)
    expect(next.servers).toEqual([b])
  })
})
```

- [ ] **Step 2: Run the registry tests to verify they fail**

Run: `pnpm test src/lib/server-registry.test.ts`
Expected: FAIL with missing module or missing exported functions from `src/lib/server-registry.ts`.

- [ ] **Step 3: Implement key builders and registry primitives**

```ts
// src/lib/server-storage.ts
export const SERVER_REGISTRY_KEY = 'holyrics:servers'
export const ACTIVE_SERVER_ID_KEY = 'holyrics:active-server-id'

export function getServerAuthKey(serverId: string) {
  return `holyrics:server:${serverId}:auth`
}

export function getServerGlobalSettingsKey(serverId: string) {
  return `holyrics:server:${serverId}:global-settings`
}

export function getServerSetupKey(serverId: string) {
  return `holyrics:server:${serverId}:setup`
}
```

```ts
// src/lib/server-registry.ts
export interface ServerRecord {
  id: string
  name: string
  serverUrl: string
  holyricsUrl: string
  createdAt: string
  updatedAt: string
  lastConnectedAt?: string | null
}

export interface ServerRegistry {
  servers: ServerRecord[]
  activeServerId: string | null
}

export function createServerRecord(input: Pick<ServerRecord, 'name' | 'serverUrl' | 'holyricsUrl'>): ServerRecord {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    serverUrl: normalizeServerUrl(input.serverUrl),
    holyricsUrl: normalizeServerUrl(input.holyricsUrl),
    createdAt: now,
    updatedAt: now,
    lastConnectedAt: null,
  }
}

export function loadServerRegistry(): ServerRegistry {
  const raw = window.localStorage.getItem(SERVER_REGISTRY_KEY)
  const activeServerId = window.localStorage.getItem(ACTIVE_SERVER_ID_KEY)
  if (!raw) return { servers: [], activeServerId }
  const servers = JSON.parse(raw) as ServerRecord[]
  return { servers, activeServerId }
}
```

- [ ] **Step 4: Implement migration from legacy single-server keys**

```ts
export function migrateLegacyServerConfig(): ServerRegistry | null {
  const existing = loadServerRegistry()
  if (existing.servers.length > 0) return existing

  const legacyServerUrl = window.localStorage.getItem('HOLYRICS_SERVER_URL')
  if (!legacyServerUrl) return null

  const migrated = createServerRecord({
    name: 'Servidor atual',
    serverUrl: legacyServerUrl,
    holyricsUrl: legacyServerUrl,
  })

  saveServerRegistry({
    servers: [migrated],
    activeServerId: migrated.id,
  })

  return loadServerRegistry()
}
```

- [ ] **Step 5: Run the registry tests to verify they pass**

Run: `pnpm test src/lib/server-registry.test.ts`
Expected: PASS for create/load/migrate/remove flows.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server-storage.ts src/lib/server-registry.ts src/lib/server-registry.test.ts
git commit -m "feat: add multi-server registry primitives"
```

## Task 2: Introduce the active server store and runtime context switching

**Files:**
- Create: `src/lib/server-context-events.ts`
- Create: `src/hooks/use-server-store.ts`
- Modify: `src/routes/__root.tsx`
- Modify: `src/lib/holyrics-instance.ts`
- Modify: `src/lib/holyrics.ts`
- Modify: `src/routes/themes.tsx`
- Test: `src/lib/global-settings.test.ts`

- [ ] **Step 1: Write the failing context-resolution test**

```ts
import { describe, expect, it } from 'vitest'
import { resolveActiveServerUrl } from '@/hooks/use-server-store'

describe('active server resolution', () => {
  it('returns the active server base url instead of the legacy singleton key', () => {
    window.localStorage.setItem(
      'holyrics:servers',
      JSON.stringify([{ id: 'prod', name: 'Prod', serverUrl: 'http://prod.local:3000', holyricsUrl: 'http://prod.local:8091', createdAt: '', updatedAt: '' }])
    )
    window.localStorage.setItem('holyrics:active-server-id', 'prod')

    expect(resolveActiveServerUrl()).toBe('http://prod.local:3000')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/global-settings.test.ts`
Expected: FAIL with missing `resolveActiveServerUrl` or wrong singleton behavior.

- [ ] **Step 3: Implement the active server store and switch event**

```ts
// src/lib/server-context-events.ts
const EVENT_NAME = 'holyrics:server-context-changed'

export function emitServerContextChanged(serverId: string | null) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { serverId } }))
}

export function subscribeToServerContextChanged(listener: () => void) {
  const handler = () => listener()
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
```

```ts
// src/hooks/use-server-store.ts
export function resolveActiveServerUrl() {
  const { servers, activeServerId } = loadServerRegistry()
  const active = servers.find((server) => server.id === activeServerId)
  if (!active) return null
  return active.serverUrl.replace(/\/+$/, '')
}

export function useServerStore() {
  const [registry, setRegistry] = useState(() => migrateLegacyServerConfig() ?? loadServerRegistry())

  const switchServer = useCallback((serverId: string) => {
    setActiveServerId(serverId)
    emitServerContextChanged(serverId)
    setRegistry(loadServerRegistry())
  }, [])

  return {
    ...registry,
    activeServer: registry.servers.find((server) => server.id === registry.activeServerId) ?? null,
    needsServerOnboarding: registry.servers.length === 0,
    switchServer,
  }
}
```

- [ ] **Step 4: Replace runtime URL reads with active-server resolution**

```ts
// src/lib/holyrics-instance.ts
const fallbackServerUrl = import.meta.env.VITE_HOLYRICS_SERVER_URL || 'http://localhost:3000'

export function getRuntimeServerUrl() {
  return resolveActiveServerUrl() ?? fallbackServerUrl
}

const baseUrl = getRuntimeServerUrl().replace(/\/+$/, '')
```

```ts
// src/routes/themes.tsx
const baseUrl = (activeServer?.serverUrl ?? fallbackServerUrl).replace(/\/+$/, '')
```

- [ ] **Step 5: Mount the server store high in the app shell**

```tsx
// src/routes/__root.tsx
function RootLayout() {
  const server = useServerStore()

  return (
    <ServerStoreProvider value={server}>
      <Header />
      <Outlet />
    </ServerStoreProvider>
  )
}
```

- [ ] **Step 6: Run targeted tests and build**

Run: `pnpm test src/lib/global-settings.test.ts`
Expected: PASS for active-server resolution and switch-notification behavior.

Run: `pnpm build`
Expected: PASS with no remaining imports of runtime-only `HOLYRICS_SERVER_URL` for active requests.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server-context-events.ts src/hooks/use-server-store.ts src/routes/__root.tsx src/lib/holyrics-instance.ts src/lib/holyrics.ts src/routes/themes.tsx src/lib/global-settings.test.ts
git commit -m "feat: add active server runtime context"
```

## Task 3: Make global settings, setup state, and offline stores server-aware

**Files:**
- Create: `src/lib/db-server.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/lib/global-settings.ts`
- Modify: `src/hooks/use-setup-store.ts`
- Modify: `src/hooks/use-songs-store.ts`
- Modify: `src/hooks/use-themes-store.ts`
- Modify: `src/hooks/use-playlists-store.ts`
- Test: `src/hooks/use-setup-store.test.ts`
- Test: `src/hooks/use-songs-store.test.ts`
- Test: `src/hooks/use-themes-store.test.ts`
- Test: `src/hooks/use-playlists-store.test.ts`

- [ ] **Step 1: Write failing store-isolation tests**

```ts
import { describe, expect, it } from 'vitest'
import { getServerGlobalSettingsKey } from '@/lib/server-storage'
import { saveGlobalSettingsToStorage, loadGlobalSettingsFromStorage } from '@/lib/global-settings'

describe('server-scoped global settings', () => {
  it('loads the snapshot for the active server only', () => {
    window.localStorage.setItem(getServerGlobalSettingsKey('test'), JSON.stringify({ initial_slide: { display_mode: 'remove' } }))
    window.localStorage.setItem(getServerGlobalSettingsKey('prod'), JSON.stringify({ initial_slide: { display_mode: 'keep' } }))

    expect(loadGlobalSettingsFromStorage('test')?.initial_slide?.display_mode).toBe('remove')
    expect(loadGlobalSettingsFromStorage('prod')?.initial_slide?.display_mode).toBe('keep')
  })
})
```

```ts
describe('server-scoped setup state', () => {
  it('does not reuse setup completion across servers', () => {
    saveSetupState('prod', { completed: ['songs'], dismissed: false, setupCompletedAt: null })

    expect(loadSetupState('prod').completed).toEqual(['songs'])
    expect(loadSetupState('test').completed).toEqual([])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/hooks/use-setup-store.test.ts src/hooks/use-songs-store.test.ts`
Expected: FAIL because storage and IndexedDB access are still global.

- [ ] **Step 3: Add server-aware IndexedDB helpers and schema fields**

```ts
// src/lib/db.ts
export interface Song {
  id: string
  serverId: string
  title: string
}

export interface HolyricsDB extends DBSchema {
  songs: {
    key: [string, string]
    value: Song
    indexes: { 'by_server': string; 'by_server_title': [string, string] }
  }
}
```

```ts
// src/lib/db-server.ts
export function songKey(serverId: string, id: string) {
  return [serverId, id] as const
}

export async function clearServerData(serverId: string) {
  const db = await getDb()
  const tx = db.transaction(['songs', 'song_details', 'themes', 'playlists', 'meta'], 'readwrite')
  // delete only rows whose serverId matches
  await tx.done
}
```

- [ ] **Step 4: Refactor global settings and setup keys to accept `serverId`**

```ts
// src/lib/global-settings.ts
export function loadGlobalSettingsFromStorage(serverId: string): HolyricsGlobalSettings | null {
  const raw = window.localStorage.getItem(getServerGlobalSettingsKey(serverId))
  return raw ? coerceGlobalSettings(JSON.parse(raw)) : null
}

export async function fetchGlobalSettings(serverId: string) {
  const cached = loadGlobalSettingsFromStorage(serverId)
  if (cached) return cached
  const response = await getApiV1SystemGlobalSettings()
  const settings = coerceGlobalSettings(response.data)
  saveGlobalSettingsToStorage(serverId, settings)
  return settings
}
```

```ts
// src/hooks/use-setup-store.ts
function loadSetupState(serverId: string): SetupState {
  const raw = localStorage.getItem(getServerSetupKey(serverId))
  return raw ? JSON.parse(raw) : { completed: [], dismissed: false, setupCompletedAt: null }
}
```

- [ ] **Step 5: Refactor songs/themes/playlists stores to reload by active server**

```ts
// src/hooks/use-songs-store.ts
export async function forceLoad(serverId = requireActiveServerId()) {
  const db = await getDb()
  const songs = await db.getAllFromIndex('songs', 'by_server', serverId)
  setState({
    songs,
    totalCount: songs.length,
    lastSyncedAt: await readMeta(`songs:lastSyncedAt:${serverId}`),
    isLoading: false,
  })
}
```

```ts
export async function syncSongs(serverId = requireActiveServerId()) {
  const response = await getApiV1Songs()
  const songs = normalizeSongs(response).map((song) => ({ ...song, serverId }))
  // clear only this server's rows, then insert the new ones
}
```

- [ ] **Step 6: Subscribe the stores to context-switch events**

```ts
useEffect(() => {
  return subscribeToServerContextChanged(() => {
    setState({ ...EMPTY_STATE, isLoading: true })
    void forceLoad()
  })
}, [])
```

- [ ] **Step 7: Run targeted tests and build**

Run: `pnpm test src/hooks/use-setup-store.test.ts src/hooks/use-songs-store.test.ts src/hooks/use-themes-store.test.ts src/hooks/use-playlists-store.test.ts`
Expected: PASS for server-scoped storage and server-switch reload behavior.

Run: `pnpm build`
Expected: PASS with server-aware function signatures updated everywhere.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db-server.ts src/lib/db.ts src/lib/global-settings.ts src/hooks/use-setup-store.ts src/hooks/use-songs-store.ts src/hooks/use-themes-store.ts src/hooks/use-playlists-store.ts src/hooks/use-setup-store.test.ts src/hooks/use-songs-store.test.ts src/hooks/use-themes-store.test.ts src/hooks/use-playlists-store.test.ts
git commit -m "feat: isolate setup and offline caches by server"
```

## Task 4: Add first-server onboarding and contextual global-settings refresh

**Files:**
- Create: `src/components/onboarding/server-onboarding-card.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/components/setup-wizard.tsx`
- Modify: `src/components/settings/auth-settings.tsx`
- Modify: `src/lib/global-settings.ts`

- [ ] **Step 1: Write the failing onboarding flow test**

```ts
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '@/routes/index'

it('shows first-server onboarding when no server exists', () => {
  window.localStorage.clear()
  render(<DashboardPage />)
  expect(screen.getByText('Cadastrar primeiro servidor')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/routes/index.test.tsx`
Expected: FAIL because the dashboard still renders without a server registry.

- [ ] **Step 3: Implement the first-server onboarding card**

```tsx
export function ServerOnboardingCard() {
  const { createServer } = useServerStore()
  const [form, setForm] = useState({ name: '', serverUrl: '', holyricsUrl: '' })

  return (
    <SurfaceCard>
      <PageHeader
        eyebrow="Onboarding"
        title="Cadastrar primeiro servidor"
        description="Crie o primeiro contexto antes de sincronizar músicas, temas e playlists."
      />
      <form onSubmit={(event) => {
        event.preventDefault()
        createServer(form)
      }}>
        {/* fields for name, serverUrl, holyricsUrl */}
      </form>
    </SurfaceCard>
  )
}
```

- [ ] **Step 4: Gate dashboard/onboarding and keep setup wizard contextual**

```tsx
// src/routes/index.tsx
const { needsServerOnboarding } = useServerStore()

if (needsServerOnboarding) {
  return (
    <AppPage>
      <ServerOnboardingCard />
    </AppPage>
  )
}
```

```ts
// src/components/setup-wizard.tsx
const serverId = useRequiredServerId()
await fetchGlobalSettings(serverId)
```

- [ ] **Step 5: Refresh global settings on server switch with cached fallback**

```ts
export async function refreshGlobalSettingsForServer(serverId: string) {
  const cached = loadGlobalSettingsFromStorage(serverId)

  try {
    const response = await getApiV1SystemGlobalSettings()
    const fresh = coerceGlobalSettings(response.data)
    saveGlobalSettingsToStorage(serverId, fresh)
    return fresh
  } catch {
    if (cached) return cached
    throw new Error('Unable to refresh global settings for active server')
  }
}
```

- [ ] **Step 6: Run the onboarding and global-settings tests**

Run: `pnpm test src/routes/index.test.tsx src/lib/global-settings.test.ts`
Expected: PASS for first-server gating and fetch-with-fallback behavior.

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/server-onboarding-card.tsx src/routes/index.tsx src/components/setup-wizard.tsx src/components/settings/auth-settings.tsx src/lib/global-settings.ts src/routes/index.test.tsx
git commit -m "feat: add first-server onboarding flow"
```

## Task 5: Add the header switcher and the settings CRUD surface

**Files:**
- Create: `src/components/server/server-switcher.tsx`
- Create: `src/components/settings/server-settings.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/settings.tsx`
- Modify: `src/components/settings/connection-status-card.tsx`
- Modify: `src/components/settings/system-settings.tsx`

- [ ] **Step 1: Write the failing UI behavior test**

```ts
import { fireEvent, render, screen } from '@testing-library/react'
import { ServerSwitcher } from '@/components/server/server-switcher'

it('switches the active server from the dropdown', async () => {
  render(<ServerSwitcher />)
  fireEvent.click(screen.getByRole('button', { name: /produção/i }))
  fireEvent.click(screen.getByText('Teste'))
  expect(screen.getByText('Teste')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/server/server-switcher.test.tsx`
Expected: FAIL because the component and store wiring do not exist yet.

- [ ] **Step 3: Implement the dropdown switcher in the app header**

```tsx
export function ServerSwitcher() {
  const { activeServer, servers, switchServer } = useServerStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-48 justify-between">
          <span className="truncate">{activeServer?.name ?? 'Selecionar servidor'}</span>
          <ChevronsUpDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {servers.map((server) => (
          <DropdownMenuItem key={server.id} onClick={() => switchServer(server.id)}>
            {server.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">Gerenciar servidores</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: Implement the `Servidores` settings tab**

```tsx
<TabsTrigger value="servers">Servidores</TabsTrigger>
<TabsContent value="servers">
  <ServerSettings />
</TabsContent>
```

```tsx
export function ServerSettings() {
  const { servers, activeServerId, createServer, updateServer, removeServer, switchServer } = useServerStore()
  // list cards + create/edit form + destructive remove confirmation
}
```

- [ ] **Step 5: Contextualize status/system panels with the active server**

```tsx
const { activeServer } = useServerStore()

<CardDescription>
  Status da conexão e informações do servidor {activeServer?.name ?? 'selecionado'}.
</CardDescription>
```

- [ ] **Step 6: Run UI tests and build**

Run: `pnpm test src/components/server/server-switcher.test.tsx src/components/settings/server-settings.test.tsx`
Expected: PASS for dropdown switch and CRUD actions.

Run: `pnpm build`
Expected: PASS with the new settings tab and header switcher mounted.

- [ ] **Step 7: Commit**

```bash
git add src/components/server/server-switcher.tsx src/components/settings/server-settings.tsx src/routes/__root.tsx src/routes/settings.tsx src/components/settings/connection-status-card.tsx src/components/settings/system-settings.tsx
git commit -m "feat: add server switcher and settings management"
```

## Task 6: Clean server removal, query invalidation, and final regression pass

**Files:**
- Modify: `src/hooks/use-server-store.ts`
- Modify: `src/lib/server-registry.ts`
- Modify: `src/lib/db-server.ts`
- Modify: `src/routes/__root.tsx`
- Modify: any touched tests that need final alignment

- [ ] **Step 1: Write the failing removal regression test**

```ts
it('deletes auth, setup, global settings, and offline data for a removed server', async () => {
  await seedServerData('prod')
  await removeServer('prod')

  expect(window.localStorage.getItem('holyrics:server:prod:auth')).toBeNull()
  expect(window.localStorage.getItem('holyrics:server:prod:setup')).toBeNull()
  expect(window.localStorage.getItem('holyrics:server:prod:global-settings')).toBeNull()
  expect(await countSongsForServer('prod')).toBe(0)
})
```

- [ ] **Step 2: Run the regression test to verify it fails**

Run: `pnpm test src/lib/server-registry.test.ts src/hooks/use-songs-store.test.ts`
Expected: FAIL because destructive cleanup is not complete yet.

- [ ] **Step 3: Implement full cleanup and query invalidation**

```ts
export async function removeServer(serverId: string) {
  const next = removeServerRecord(serverId)
  clearServerScopedLocalStorage(serverId)
  await clearServerData(serverId)

  queryClient.clear()
  emitServerContextChanged(next.activeServerId)
  return next
}
```

```tsx
// src/routes/__root.tsx
const queryClient = new QueryClient()

useEffect(() => {
  return subscribeToServerContextChanged(() => {
    queryClient.invalidateQueries()
  })
}, [])
```

- [ ] **Step 4: Run the full verification suite**

Run: `pnpm test`
Expected: PASS for all added multi-server tests.

Run: `pnpm build`
Expected: PASS with no type errors.

- [ ] **Step 5: Smoke-check the critical UX flows**

Run these manual checks after the build:

```text
1. Fresh localStorage -> app shows first-server onboarding.
2. Create "Teste" server -> auth tab works -> setup wizard syncs only "Teste".
3. Add "Produção" in settings -> switch from header -> connection/global settings update for "Produção".
4. Force a failed global-settings fetch on switch -> UI keeps last cached snapshot for that server.
5. Remove one server -> its local data disappears and the other server remains intact.
6. Remove the last server -> app returns to onboarding.
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-server-store.ts src/lib/server-registry.ts src/lib/db-server.ts src/routes/__root.tsx
git commit -m "feat: finalize multi-server context cleanup"
```

## Self-Review

Spec coverage checked:

- Multi-server registry: Task 1
- Active server context and runtime URL resolution: Task 2
- Per-server auth/cache/setup/offline isolation: Tasks 1, 3, and 6
- Onboarding for first server: Task 4
- Header dropdown and settings CRUD: Task 5
- Global settings refresh on switch with cached fallback: Task 4
- Removal behavior and last-server fallback to onboarding: Task 6

Placeholder scan checked:

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task has explicit files, commands, and concrete code direction.

Type consistency checked:

- `serverId`, `ServerRecord`, `ServerRegistry`, and the namespaced storage helper names are consistent across tasks.

