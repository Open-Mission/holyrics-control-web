import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

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

export interface HolyricsDB extends DBSchema {
  songs: {
    key: string
    value: Song
    indexes: { by_title: string; by_group: string }
  }
  meta: {
    key: string
    value: { key: string; value: string }
  }
  song_details: {
    key: string
    value: SongDetailRecord
  }
  themes: {
    key: string
    value: Theme
    indexes: { by_name: string }
  }
  playlists: {
    key: string
    value: { name: string }
  }
}

// ─── DB singleton ─────────────────────────────────────────────────────────────

const DB_NAME = 'holyrics'
const DB_VERSION = 4 // Increased to v4 to add playlists

let _dbPromise: Promise<IDBPDatabase<HolyricsDB>> | null = null

export function getDb(): Promise<IDBPDatabase<HolyricsDB>> {
  if (!_dbPromise) {
    _dbPromise = openDB<HolyricsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
