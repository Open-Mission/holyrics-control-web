import { holyricsHashSessionSchema, type HolyricsHashSession } from '@/api/holyrics/core/schemas'
import { getServerById } from '@/lib/server-registry'
import {
  loadServerAuthState,
  saveServerAuthState,
  type ServerAuthState,
} from '@/lib/server-storage'

function encodeUtf8(value: string) {
  return new TextEncoder().encode(value)
}

async function sha256(value: string) {
  const buffer = await crypto.subtle.digest('SHA-256', encodeUtf8(value))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function getServerToken(serverId: string) {
  return loadServerAuthState(serverId)?.token?.trim() ?? ''
}

export function assertServerToken(serverId: string) {
  const token = getServerToken(serverId)
  if (!token) {
    throw new Error('Nenhum token configurado para o servidor ativo.')
  }
  return token
}

export function getStoredHashSession(serverId: string): HolyricsHashSession | null {
  const auth = loadServerAuthState(serverId)
  const parsed = holyricsHashSessionSchema.safeParse(auth)
  return parsed.success ? parsed.data : null
}

export function saveHashSession(serverId: string, session: HolyricsHashSession) {
  const auth = loadServerAuthState(serverId)
  saveServerAuthState(serverId, {
    ...(auth ?? { token: '' }),
    sid: session.sid,
    nonce: session.nonce,
    rid: session.rid,
    authenticatedAt: session.authenticatedAt,
  })
}

function nextRid(serverId: string) {
  const auth = loadServerAuthState(serverId)
  const rid = Math.max(0, auth?.rid ?? 0) + 1
  saveServerAuthState(serverId, {
    ...(auth ?? { token: '' }),
    rid,
  })
  return rid
}

export async function createSignedLocalRequest(
  serverId: string,
  payloadText: string
) {
  const auth = loadServerAuthState(serverId)
  const token = assertServerToken(serverId)

  if (!auth?.sid || !auth?.nonce) {
    throw new Error('Sessão hash indisponível para este servidor.')
  }

  const rid = nextRid(serverId)
  const dtoken = await sha256(`${auth.nonce}:${rid}:${token}:${payloadText}`)

  return {
    sid: auth.sid,
    rid,
    dtoken,
  }
}

export async function authenticateLocalHashSession(serverId: string) {
  const server = getServerById(serverId)
  if (!server) {
    throw new Error('Servidor não encontrado.')
  }

  const token = assertServerToken(serverId)
  const authUrl = `${server.url}/api/Auth`
  const initialResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!initialResponse.ok) {
    throw new Error(`Falha ao obter nonce (${initialResponse.status}).`)
  }

  const initialJson = await initialResponse.json()
  const sid = initialJson?.data?.sid
  const nonce = initialJson?.data?.nonce

  if (!sid || !nonce) {
    throw new Error('Resposta inválida ao solicitar nonce do Holyrics.')
  }

  const dtoken = await sha256(`${nonce}:0:${token}:auth`)
  const verifyUrl = `${server.url}/api/Auth?sid=${encodeURIComponent(sid)}&rid=0&dtoken=${encodeURIComponent(dtoken)}`

  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify('auth'),
  })

  if (!verifyResponse.ok) {
    throw new Error(`Falha ao autenticar sessão hash (${verifyResponse.status}).`)
  }

  const verifyJson = await verifyResponse.json()
  if (verifyJson?.status !== 'ok') {
    throw new Error(typeof verifyJson?.error === 'string' ? verifyJson.error : 'Falha ao autenticar sessão hash.')
  }

  const nextAuthState: ServerAuthState = {
    ...(loadServerAuthState(serverId) ?? { token }),
    token,
    sid,
    nonce,
    rid: 0,
    authenticatedAt: new Date().toISOString(),
  }

  saveServerAuthState(serverId, nextAuthState)
  return nextAuthState
}
