import { authenticateLocalHashSession } from '@/api/holyrics/core/auth'
import { getTokenInfo } from '@/api/holyrics/modules/system'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { saveServerAuthState } from '@/lib/server-storage'

export async function authenticateWithToken(token: string) {
  const server = getCurrentActiveServer()
  if (!server) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  saveServerAuthState(server.id, {
    ...(token ? { token: token.trim() } : {}),
    token: token.trim(),
  })

  return getTokenInfo()
}

export async function authenticateWithStoredToken() {
  return getTokenInfo()
}

export async function authenticateWithHashSession() {
  const server = getCurrentActiveServer()
  if (!server) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  return authenticateLocalHashSession(server.id)
}
