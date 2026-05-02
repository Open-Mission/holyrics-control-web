import {
  getDb,
  type MediaLibraryItem,
  type MediaType,
  type Song,
  type SongDetailRecord,
  type Theme,
} from '@/lib/db'
import { getMediaBaseName, normalizeMediaPath } from '@/lib/media'

export interface PlaylistRecord {
  name: string
}

function createServerMediaKey(serverId: string, mediaType: MediaType, path: string) {
  return `${serverId}::${mediaType}::${normalizeMediaPath(path)}`
}

function createServerMediaParentKey(
  serverId: string,
  mediaType: MediaType,
  parentPath: string
) {
  return `${serverId}::${mediaType}::${normalizeMediaPath(parentPath)}`
}

function createScopedKey(serverId: string, itemId: string) {
  return `${serverId}::${itemId}`
}

export function createServerSongRecord(serverId: string, song: Song) {
  return {
    key: createScopedKey(serverId, song.id),
    serverId,
    itemId: song.id,
    payload: song,
  }
}

export function createServerSongDetailRecord(serverId: string, detail: SongDetailRecord) {
  return {
    key: createScopedKey(serverId, detail.id),
    serverId,
    itemId: detail.id,
    payload: detail,
  }
}

export function createServerThemeRecord(serverId: string, theme: Theme) {
  return {
    key: createScopedKey(serverId, String(theme.id)),
    serverId,
    itemId: String(theme.id),
    payload: theme,
  }
}

export function createServerPlaylistRecord(serverId: string, playlist: PlaylistRecord) {
  return {
    key: createScopedKey(serverId, playlist.name),
    serverId,
    itemId: playlist.name,
    payload: playlist,
  }
}

export function createServerMediaRecord(
  serverId: string,
  mediaType: MediaType,
  item: MediaLibraryItem
) {
  const normalizedPath = normalizeMediaPath(item.path)
  const normalizedParentPath = normalizeMediaPath(item.parentPath)

  return {
    key: createServerMediaKey(serverId, mediaType, normalizedPath),
    serverId,
    mediaType,
    path: normalizedPath,
    parentPath: normalizedParentPath,
    payload: {
      ...item,
      mediaType,
      path: normalizedPath,
      parentPath: normalizedParentPath,
    },
    serverMediaKey: `${serverId}::${mediaType}`,
    serverMediaParentKey: createServerMediaParentKey(
      serverId,
      mediaType,
      normalizedParentPath
    ),
    basename: getMediaBaseName(normalizedPath).toLowerCase(),
  }
}

export function createServerMetaKey(serverId: string, key: string) {
  return `${serverId}::${key}`
}

export async function readServerSongs(serverId: string) {
  const db = await getDb()
  const rows = await db.getAllFromIndex('songs', 'by_server', serverId)
  return rows.map((row) => row.payload)
}

export async function writeServerSongs(serverId: string, songs: Song[]) {
  const db = await getDb()
  const existingKeys = await db.getAllKeysFromIndex('songs', 'by_server', serverId)
  const tx = db.transaction(['songs'], 'readwrite')
  await Promise.all(existingKeys.map((key) => tx.objectStore('songs').delete(key)))
  await Promise.all(
    songs.map((song) => tx.objectStore('songs').put(createServerSongRecord(serverId, song)))
  )
  await tx.done
}

export async function readServerSongDetail(serverId: string, songId: string) {
  const db = await getDb()
  return db.get('song_details', createScopedKey(serverId, songId))
}

export async function writeServerSongDetail(serverId: string, detail: SongDetailRecord) {
  const db = await getDb()
  await db.put('song_details', createServerSongDetailRecord(serverId, detail))
}

export async function deleteServerSongDetail(serverId: string, songId: string) {
  const db = await getDb()
  await db.delete('song_details', createScopedKey(serverId, songId))
}

export async function readServerThemes(serverId: string) {
  const db = await getDb()
  const rows = await db.getAllFromIndex('themes', 'by_server', serverId)
  return rows.map((row) => row.payload)
}

export async function writeServerThemes(serverId: string, themes: Theme[]) {
  const db = await getDb()
  const existingKeys = await db.getAllKeysFromIndex('themes', 'by_server', serverId)
  const tx = db.transaction(['themes'], 'readwrite')
  await Promise.all(existingKeys.map((key) => tx.objectStore('themes').delete(key)))
  await Promise.all(
    themes.map((theme) => tx.objectStore('themes').put(createServerThemeRecord(serverId, theme)))
  )
  await tx.done
}

export async function readServerPlaylists(serverId: string) {
  const db = await getDb()
  const rows = await db.getAllFromIndex('playlists', 'by_server', serverId)
  return rows.map((row) => row.payload)
}

export async function writeServerPlaylists(serverId: string, playlists: PlaylistRecord[]) {
  const db = await getDb()
  const existingKeys = await db.getAllKeysFromIndex('playlists', 'by_server', serverId)
  const tx = db.transaction(['playlists'], 'readwrite')
  await Promise.all(existingKeys.map((key) => tx.objectStore('playlists').delete(key)))
  await Promise.all(
    playlists.map((playlist) =>
      tx.objectStore('playlists').put(createServerPlaylistRecord(serverId, playlist))
    )
  )
  await tx.done
}

export async function readServerMeta(serverId: string, key: string) {
  const db = await getDb()
  return db.get('meta', createServerMetaKey(serverId, key))
}

export async function readServerMediaItems(serverId: string, mediaType: MediaType) {
  const db = await getDb()
  const rows = await db.getAllFromIndex(
    'media_items',
    'by_server_media',
    `${serverId}::${mediaType}`
  )
  return rows.map((row) => row.payload)
}

export async function readServerMediaChildren(
  serverId: string,
  mediaType: MediaType,
  parentPath = ''
) {
  const db = await getDb()
  const rows = await db.getAllFromIndex(
    'media_items',
    'by_server_media_parent',
    createServerMediaParentKey(serverId, mediaType, parentPath)
  )
  return rows.map((row) => row.payload)
}

export async function readServerMediaItem(
  serverId: string,
  mediaType: MediaType,
  path: string
) {
  const db = await getDb()
  return db.get('media_items', createServerMediaKey(serverId, mediaType, path))
}

export async function writeServerMediaItems(
  serverId: string,
  mediaType: MediaType,
  items: MediaLibraryItem[]
) {
  const db = await getDb()
  const tx = db.transaction(['media_items'], 'readwrite')
  await Promise.all(
    items.map((item) =>
      tx.objectStore('media_items').put(createServerMediaRecord(serverId, mediaType, item))
    )
  )
  await tx.done
}

export async function deleteServerMediaChildren(
  serverId: string,
  mediaType: MediaType,
  parentPath = ''
) {
  const db = await getDb()
  const keys = await db.getAllKeysFromIndex(
    'media_items',
    'by_server_media_parent',
    createServerMediaParentKey(serverId, mediaType, parentPath)
  )
  const tx = db.transaction(['media_items'], 'readwrite')
  await Promise.all(keys.map((key) => tx.objectStore('media_items').delete(key)))
  await tx.done
}

export async function deleteServerMediaSubtree(
  serverId: string,
  mediaType: MediaType,
  path: string
) {
  const db = await getDb()
  const normalizedPath = normalizeMediaPath(path)
  const rows = await db.getAllFromIndex(
    'media_items',
    'by_server_media',
    `${serverId}::${mediaType}`
  )

  const keysToDelete = rows
    .filter(
      (row) =>
        row.payload.path === normalizedPath ||
        row.payload.path.startsWith(`${normalizedPath}/`)
    )
    .map((row) => row.key)

  const tx = db.transaction(['media_items'], 'readwrite')
  await Promise.all(
    keysToDelete.map((key) => tx.objectStore('media_items').delete(key))
  )
  await tx.done
}

export async function replaceServerMediaChildren(
  serverId: string,
  mediaType: MediaType,
  parentPath: string,
  items: MediaLibraryItem[]
) {
  const existingChildren = await readServerMediaChildren(serverId, mediaType, parentPath)
  await Promise.all(
    existingChildren
      .filter((child) => child.isDir)
      .map((child) => deleteServerMediaSubtree(serverId, mediaType, child.path))
  )
  await deleteServerMediaChildren(serverId, mediaType, parentPath)
  await writeServerMediaItems(serverId, mediaType, items)
}

export async function markServerMediaFolderScanned(
  serverId: string,
  mediaType: MediaType,
  path: string,
  hasScannedChildren = true
) {
  const existing = await readServerMediaItem(serverId, mediaType, path)
  if (!existing) return

  const db = await getDb()
  await db.put(
    'media_items',
    createServerMediaRecord(serverId, mediaType, {
      ...existing.payload,
      hasScannedChildren,
    })
  )
}

export async function resolveServerMediaPath(
  serverId: string,
  mediaType: MediaType,
  reference: string
) {
  const normalizedReference = normalizeMediaPath(reference)
  if (!normalizedReference) return null

  const exact = await readServerMediaItem(serverId, mediaType, normalizedReference)
  if (exact) return exact.payload.path

  const db = await getDb()
  const basenameMatches = await db.getAllFromIndex(
    'media_items',
    'by_server_media_basename',
    getMediaBaseName(normalizedReference).toLowerCase()
  )

  const scopedMatches = basenameMatches.filter(
    (row) => row.serverId === serverId && row.mediaType === mediaType
  )

  if (scopedMatches.length === 1) {
    return scopedMatches[0]?.payload.path ?? null
  }

  return null
}

export async function writeServerMeta(serverId: string, key: string, value: string) {
  const db = await getDb()
  await db.put('meta', {
    key: createServerMetaKey(serverId, key),
    serverId,
    value,
  })
}

export async function deleteServerMeta(serverId: string, key: string) {
  const db = await getDb()
  await db.delete('meta', createServerMetaKey(serverId, key))
}

export async function clearServerOfflineData(serverId: string) {
  const db = await getDb()
  const [songKeys, detailKeys, themeKeys, playlistKeys, mediaKeys, metaKeys] = await Promise.all([
    db.getAllKeysFromIndex('songs', 'by_server', serverId),
    db.getAllKeysFromIndex('song_details', 'by_server', serverId),
    db.getAllKeysFromIndex('themes', 'by_server', serverId),
    db.getAllKeysFromIndex('playlists', 'by_server', serverId),
    db.getAllKeysFromIndex('media_items', 'by_server_media', `${serverId}::image`)
      .then((keys) => [
        ...keys,
      ]),
    db.getAllKeysFromIndex('meta', 'by_server', serverId),
  ])

  const [audioMediaKeys, videoMediaKeys] = await Promise.all([
    db.getAllKeysFromIndex('media_items', 'by_server_media', `${serverId}::audio`),
    db.getAllKeysFromIndex('media_items', 'by_server_media', `${serverId}::video`),
  ])

  const tx = db.transaction(
    ['songs', 'song_details', 'themes', 'playlists', 'media_items', 'meta'],
    'readwrite'
  )

  await Promise.all([
    ...songKeys.map((key) => tx.objectStore('songs').delete(key)),
    ...detailKeys.map((key) => tx.objectStore('song_details').delete(key)),
    ...themeKeys.map((key) => tx.objectStore('themes').delete(key)),
    ...playlistKeys.map((key) => tx.objectStore('playlists').delete(key)),
    ...mediaKeys.map((key) => tx.objectStore('media_items').delete(key)),
    ...audioMediaKeys.map((key) => tx.objectStore('media_items').delete(key)),
    ...videoMediaKeys.map((key) => tx.objectStore('media_items').delete(key)),
    ...metaKeys.map((key) => tx.objectStore('meta').delete(key)),
  ])

  await tx.done
}
