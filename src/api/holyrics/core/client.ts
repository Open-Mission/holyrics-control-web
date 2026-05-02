import { z, type ZodType } from 'zod'

import {
  createSignedLocalRequest,
  getServerToken,
} from '@/api/holyrics/core/auth'
import {
  holyricsInternetEnvelopeSchema,
  holyricsLocalEnvelopeSchema,
} from '@/api/holyrics/core/schemas'
import { getCurrentActiveServer } from '@/hooks/use-server-store'

export class HolyricsError extends Error {
  code?: string | number

  constructor(message: string, code?: string | number) {
    super(message)
    this.name = 'HolyricsError'
    this.code = code
  }
}

type TransportMode = 'local' | 'internet-request' | 'internet-send'

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}

function resolveActiveServer() {
  const server = getCurrentActiveServer()
  if (!server) {
    throw new HolyricsError('Nenhum servidor ativo configurado.')
  }
  return {
    ...server,
    url: normalizeUrl(server.url),
  }
}

function resolveTransportMode(url: string): TransportMode {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    if (parsed.hostname === 'api.holyrics.com.br' || path.endsWith('/request') || path.endsWith('/send')) {
      return path.endsWith('/send') ? 'internet-send' : 'internet-request'
    }
  } catch {
    // ignore and treat as local below
  }
  return 'local'
}

function parseInternetApiKey(url: string) {
  const parsed = new URL(url)
  return parsed.searchParams.get('api_key')
}

function stripSearch(url: string) {
  const parsed = new URL(url)
  parsed.search = ''
  return parsed.toString().replace(/\/+$/, '')
}

function assertLocalEnvelope(response: unknown) {
  const parsed = holyricsLocalEnvelopeSchema.safeParse(response)
  if (!parsed.success) {
    throw new HolyricsError('Resposta inválida do Holyrics.')
  }

  if (parsed.data.status !== 'ok') {
    const errorValue = parsed.data.error
    if (typeof errorValue === 'string') {
      throw new HolyricsError(errorValue)
    }

    if (errorValue && typeof errorValue === 'object') {
      const message = 'message' in errorValue && typeof errorValue.message === 'string'
        ? errorValue.message
        : 'Erro retornado pelo Holyrics.'
      const code = 'code' in errorValue ? (errorValue.code as string | number) : undefined
      throw new HolyricsError(message, code)
    }

    throw new HolyricsError('Erro retornado pelo Holyrics.')
  }

  return parsed.data
}

function assertInternetEnvelope(response: unknown) {
  const parsed = holyricsInternetEnvelopeSchema.safeParse(response)
  if (!parsed.success) {
    throw new HolyricsError('Resposta inválida do Holyrics Web.')
  }

  if (parsed.data.status !== 'ok') {
    const errorValue = parsed.data.error
    if (errorValue && typeof errorValue === 'object') {
      const message = 'message' in errorValue && typeof errorValue.message === 'string'
        ? errorValue.message
        : 'Erro retornado pelo Holyrics Web.'
      const code = 'code' in errorValue ? (errorValue.code as string | number) : undefined
      throw new HolyricsError(message, code)
    }

    throw new HolyricsError(typeof errorValue === 'string' ? errorValue : 'Erro retornado pelo Holyrics Web.')
  }

  if (parsed.data.response_status && parsed.data.response_status !== 'ok') {
    throw new HolyricsError(`Holyrics Web respondeu com status ${parsed.data.response_status}.`)
  }

  const responseEnvelope = parsed.data.response ?? { status: 'ok', data: parsed.data.data }
  return assertLocalEnvelope(responseEnvelope)
}

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new HolyricsError('Resposta não está em JSON válido.')
  }
}

async function localRequest(
  url: string,
  serverId: string,
  token: string,
  action: string,
  payload: unknown,
  options?: { preferHash?: boolean; signal?: AbortSignal }
) {
  const payloadText = JSON.stringify(payload ?? {})
  const baseUrl = `${url}/api/${action}`

  let requestUrl = `${baseUrl}?token=${encodeURIComponent(token)}`
  if (options?.preferHash) {
    try {
      const signed = await createSignedLocalRequest(serverId, payloadText)
      requestUrl = `${baseUrl}?sid=${encodeURIComponent(signed.sid)}&rid=${signed.rid}&dtoken=${encodeURIComponent(signed.dtoken)}`
    } catch {
      // silently fall back to token mode
    }
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payloadText,
    signal: options?.signal,
  })

  if (!response.ok) {
    throw new HolyricsError(`Falha na requisição ao Holyrics (${response.status}).`)
  }

  const json = await readJson(response)
  return assertLocalEnvelope(json)
}

async function internetRequest(
  url: string,
  token: string,
  action: string,
  payload: unknown,
  mode: TransportMode,
  signal?: AbortSignal
) {
  const apiKey = parseInternetApiKey(url)
  if (!apiKey) {
    throw new HolyricsError('URL da integração web precisa incluir `api_key` na query string.')
  }

  const baseUrl = stripSearch(url)
  const endpoint = mode === 'internet-send'
    ? `${baseUrl}/${action}`
    : `${baseUrl}/${action}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_key: apiKey,
      token,
    },
    body: JSON.stringify(payload ?? {}),
    signal,
  })

  if (!response.ok) {
    throw new HolyricsError(`Falha na requisição ao Holyrics Web (${response.status}).`)
  }

  const json = await readJson(response)
  return assertInternetEnvelope(json)
}

export interface HolyricsActionOptions<TSchema extends ZodType | undefined = undefined> {
  action: string
  payload?: unknown
  responseSchema?: TSchema
  preferHash?: boolean
  signal?: AbortSignal
}

export async function requestHolyricsAction<TSchema extends ZodType | undefined = undefined>({
  action,
  payload = {},
  responseSchema,
  preferHash,
  signal,
}: HolyricsActionOptions<TSchema>): Promise<TSchema extends ZodType ? z.infer<TSchema> : unknown> {
  const server = resolveActiveServer()
  const token = getServerToken(server.id)
  if (!token) {
    throw new HolyricsError('Nenhum token configurado para o servidor ativo.')
  }

  const mode = resolveTransportMode(server.url)
  const envelope = mode === 'local'
    ? await localRequest(server.url, server.id, token, action, payload, { preferHash, signal })
    : await internetRequest(server.url, token, action, payload, mode, signal)

  const rawData = envelope.data
  if (!responseSchema) {
    return rawData as TSchema extends ZodType ? z.infer<TSchema> : unknown
  }

  return responseSchema.parse(rawData) as TSchema extends ZodType ? z.infer<TSchema> : unknown
}

export function resolveActiveHolyricsUrl() {
  return resolveActiveServer().url
}
