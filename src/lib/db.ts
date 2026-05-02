import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { getActiveServer } from '@/lib/server-registry'

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface Song {
  id: string
  title: string
  artist?: string
  author?: string
  copyright?: string
  note?: string
  group?: string
  order?: string
  [key: string]: unknown
}

export interface LyricSlide {
  text: string
  styled_text?: string
  slide_description?: string
  background_id?: string | null
  translations?: Record<string, string> | null
}

export interface SongDetailRecord extends Song {
  language?: string
  slides?: LyricSlide[]
  formatting_type?: 'basic' | 'styled' | 'advanced'
  key?: string
  bpm?: number
  time_sig?: string
  archived?: boolean
  extras?: Record<string, unknown>
  _fetchedAt?: string
  _dirty?: boolean
  _dirtyFields?: string[]
}

export interface Theme {
  id: string | number
  name: string
  background?: {
    type: string
    id: string | number
    opacity?: number
    adjust_type?: string
    velocity?: number
  }
  font?: {
    name: string | null
    bold: boolean | null
    italic: boolean | null
    size: number | null
    color: string | null
    line_spacing?: number
    char_spacing?: number
  }
  metadata?: {
    modified_time_millis: number
  }
}

export type MediaType = 'image' | 'video' | 'audio'

export interface MediaLibraryItem {
  mediaType: MediaType
  path: string
  parentPath: string
  name: string
  isDir: boolean
  extension?: string
  properties?: Record<string, unknown>
  length?: number
  modified_time?: string
  modified_time_millis?: number
  duration_ms?: number
  width?: number
  height?: number
  position?: string
  blur?: boolean
  transparent?: boolean
  last_executed_time?: string
  last_executed_time_millis?: number
  thumbnail?: string
  hasScannedChildren?: boolean
  discoveredAt?: string
}

export interface HolyricsDB extends DBSchema {
  songs: {
    key: string
    value: {
      key: string
      serverId: string
      itemId: string
      payload: Song
    }
    indexes: { by_server: string; by_title: string; by_group: string }
  }
  meta: {
    key: string
    value: { key: string; serverId: string; value: string }
    indexes: { by_server: string }
  }
  song_details: {
    key: string
    value: {
      key: string
      serverId: string
      itemId: string
      payload: SongDetailRecord
    }
    indexes: { by_server: string }
  }
  themes: {
    key: string
    value: {
      key: string
      serverId: string
      itemId: string
      payload: Theme
    }
    indexes: { by_server: string; by_name: string }
  }
  playlists: {
    key: string
    value: {
      key: string
      serverId: string
      itemId: string
      payload: { name: string }
    }
    indexes: { by_server: string }
  }
  media_items: {
    key: string
    value: {
      key: string
      serverId: string
      mediaType: MediaType
      path: string
      parentPath: string
      payload: MediaLibraryItem
      serverMediaKey: string
      serverMediaParentKey: string
      basename: string
    }
    indexes: {
      by_server_media: string
      by_server_media_parent: string
      by_server_media_basename: string
    }
  }
}

// ─── DB singleton ─────────────────────────────────────────────────────────────

const DB_NAME = 'holyrics'
const DB_VERSION = 6

function getLegacyMigrationServerId() {
  return getActiveServer()?.id ?? 'legacy-singleton'
}

let _dbPromise: Promise<IDBPDatabase<HolyricsDB>> | null = null

export function getDb(): Promise<IDBPDatabase<HolyricsDB>> {
  if (!_dbPromise) {
    _dbPromise = openDB<HolyricsDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const s = db.createObjectStore('songs', { keyPath: 'id' })
          s.createIndex('by_title', 'title')
          s.createIndex('by_group', 'group')
          db.createObjectStore('meta', { keyPath: 'key' })
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('song_details')) {
            db.createObjectStore('song_details', { keyPath: 'id' })
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('themes')) {
            const t = db.createObjectStore('themes', { keyPath: 'id' })
            t.createIndex('by_name', 'name')
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'name' })
          }
        }
        if (oldVersion < 5) {
          const migrationServerId = getLegacyMigrationServerId()

          const legacySongs = db.objectStoreNames.contains('songs')
            ? await transaction.objectStore('songs').getAll()
            : []
          const legacySongDetails = db.objectStoreNames.contains('song_details')
            ? await transaction.objectStore('song_details').getAll()
            : []
          const legacyThemes = db.objectStoreNames.contains('themes')
            ? await transaction.objectStore('themes').getAll()
            : []
          const legacyPlaylists = db.objectStoreNames.contains('playlists')
            ? await transaction.objectStore('playlists').getAll()
            : []
          const legacyMeta = db.objectStoreNames.contains('meta')
            ? await transaction.objectStore('meta').getAll()
            : []

          if (db.objectStoreNames.contains('songs')) db.deleteObjectStore('songs')
          if (db.objectStoreNames.contains('song_details')) db.deleteObjectStore('song_details')
          if (db.objectStoreNames.contains('themes')) db.deleteObjectStore('themes')
          if (db.objectStoreNames.contains('playlists')) db.deleteObjectStore('playlists')
          if (db.objectStoreNames.contains('meta')) db.deleteObjectStore('meta')

          const songsStore = db.createObjectStore('songs', { keyPath: 'key' })
          songsStore.createIndex('by_server', 'serverId')
          songsStore.createIndex('by_title', 'payload.title')
          songsStore.createIndex('by_group', 'payload.group')

          const detailsStore = db.createObjectStore('song_details', { keyPath: 'key' })
          detailsStore.createIndex('by_server', 'serverId')

          const themesStore = db.createObjectStore('themes', { keyPath: 'key' })
          themesStore.createIndex('by_server', 'serverId')
          themesStore.createIndex('by_name', 'payload.name')

          const playlistsStore = db.createObjectStore('playlists', { keyPath: 'key' })
          playlistsStore.createIndex('by_server', 'serverId')

          const metaStore = db.createObjectStore('meta', { keyPath: 'key' })
          metaStore.createIndex('by_server', 'serverId')

          for (const song of legacySongs) {
            const payload = song as unknown as Song
            await songsStore.put({
              key: `${migrationServerId}::${payload.id}`,
              serverId: migrationServerId,
              itemId: payload.id,
              payload,
            })
          }

          for (const detail of legacySongDetails) {
            const payload = detail as unknown as SongDetailRecord
            await detailsStore.put({
              key: `${migrationServerId}::${payload.id}`,
              serverId: migrationServerId,
              itemId: payload.id,
              payload,
            })
          }

          for (const theme of legacyThemes) {
            const payload = theme as unknown as Theme
            await themesStore.put({
              key: `${migrationServerId}::${payload.id}`,
              serverId: migrationServerId,
              itemId: String(payload.id),
              payload,
            })
          }

          for (const playlist of legacyPlaylists) {
            const payload = playlist as unknown as { name: string }
            await playlistsStore.put({
              key: `${migrationServerId}::${payload.name}`,
              serverId: migrationServerId,
              itemId: payload.name,
              payload,
            })
          }

          for (const meta of legacyMeta) {
            const payload = meta as { key: string; value: string }
            await metaStore.put({
              key: `${migrationServerId}::${payload.key}`,
              serverId: migrationServerId,
              value: payload.value,
            })
          }
        }
        if (oldVersion < 6) {
          if (!db.objectStoreNames.contains('media_items')) {
            const mediaStore = db.createObjectStore('media_items', {
              keyPath: 'key',
            })
            mediaStore.createIndex('by_server_media', 'serverMediaKey')
            mediaStore.createIndex(
              'by_server_media_parent',
              'serverMediaParentKey'
            )
            mediaStore.createIndex(
              'by_server_media_basename',
              'basename'
            )
          }
        }
      },
      blocked() {
        console.warn('[DB] IDB upgrade blocked by another tab.')
      },
      blocking() {
        _db?.close()
        _dbPromise = null
      },
    }).catch((err) => {
      _dbPromise = null
      throw err
    })
  }
  return _dbPromise
}

let _db: IDBPDatabase<HolyricsDB> | null = null
getDb().then((db) => { _db = db }).catch(() => {})
