import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { getConnectionStatus } from '@/api/holyrics'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
  type LocalNotificationPermission,
} from '@/lib/notifications'
import { subscribeToServerContextChange } from '@/lib/server-context-events'

const POLL_INTERVAL_MS = 15000

export interface HolyricsConnectionState {
  activeServerId: string | null
  activeServerName: string | null
  browserOnline: boolean
  holyricsReachable: boolean | null
  isChecking: boolean
  lastCheckedAt: string | null
  lastReachableAt: string | null
  lastError: string | null
  notificationPermission: LocalNotificationPermission
}

let _started = false
let _checkInFlight: Promise<void> | null = null

let _state: HolyricsConnectionState = {
  activeServerId: null,
  activeServerName: null,
  browserOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  holyricsReachable: null,
  isChecking: false,
  lastCheckedAt: null,
  lastReachableAt: null,
  lastError: null,
  notificationPermission: getNotificationPermission(),
}

const _listeners = new Set<() => void>()

function emit() {
  _listeners.forEach((listener) => listener())
}

function setState(patch: Partial<HolyricsConnectionState>) {
  _state = { ..._state, ...patch }
  emit()
}

function getSnapshot() {
  return _state
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function syncServerState() {
  const server = getCurrentActiveServer()

  setState({
    activeServerId: server?.id ?? null,
    activeServerName: server?.name ?? null,
    holyricsReachable: server ? _state.holyricsReachable : null,
    lastError: server ? _state.lastError : null,
    lastCheckedAt: server ? _state.lastCheckedAt : null,
    lastReachableAt: server ? _state.lastReachableAt : null,
  })

  if (!server) {
    setState({
      holyricsReachable: null,
      isChecking: false,
      lastCheckedAt: null,
      lastReachableAt: null,
      lastError: null,
    })
  }
}

function syncNotificationState() {
  setState({
    notificationPermission: getNotificationPermission(),
  })
}

async function notifyConnectionLost(serverName: string | null, message: string) {
  toast.error(message)
  await showLocalNotification('Holyrics desconectado', {
    body: serverName
      ? `A conexão com "${serverName}" foi perdida. Os dados locais continuam disponíveis.`
      : 'A conexão com o Holyrics foi perdida. Os dados locais continuam disponíveis.',
    tag: 'holyrics-connection-lost',
  })
}

async function notifyConnectionRestored(serverName: string | null) {
  const message = serverName
    ? `Conexão com "${serverName}" restaurada.`
    : 'Conexão com o Holyrics restaurada.'

  toast.success(message)
  await showLocalNotification('Holyrics reconectado', {
    body: message,
    tag: 'holyrics-connection-restored',
  })
}

async function runConnectionCheck() {
  const server = getCurrentActiveServer()
  if (!server) {
    setState({
      activeServerId: null,
      activeServerName: null,
      holyricsReachable: null,
      isChecking: false,
      lastCheckedAt: null,
      lastError: null,
    })
    return
  }

  if (_checkInFlight) {
    return _checkInFlight
  }

  const previousReachable = _state.holyricsReachable

  setState({
    activeServerId: server.id,
    activeServerName: server.name,
    browserOnline: navigator.onLine,
    isChecking: true,
  })

  _checkInFlight = (async () => {
    const checkedAt = new Date().toISOString()

    try {
      await getConnectionStatus()

      setState({
        holyricsReachable: true,
        isChecking: false,
        lastCheckedAt: checkedAt,
        lastReachableAt: checkedAt,
        lastError: null,
      })

      if (previousReachable === false) {
        await notifyConnectionRestored(server.name)
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível alcançar o Holyrics neste momento.'

      setState({
        holyricsReachable: false,
        isChecking: false,
        lastCheckedAt: checkedAt,
        lastError: message,
      })

      if (previousReachable === true) {
        await notifyConnectionLost(server.name, 'Conexão com o Holyrics perdida.')
      }
    } finally {
      _checkInFlight = null
    }
  })()

  return _checkInFlight
}

function handleBrowserOnline() {
  setState({ browserOnline: true })
  void runConnectionCheck()
}

function handleBrowserOffline() {
  const previousReachable = _state.holyricsReachable

  setState({
    browserOnline: false,
    holyricsReachable: _state.activeServerId ? false : null,
    lastCheckedAt: new Date().toISOString(),
    lastError: 'O dispositivo está sem conectividade de rede.',
  })

  if (previousReachable === true) {
    void notifyConnectionLost(_state.activeServerName, 'Conectividade de rede indisponível no dispositivo.')
  }
}

function startMonitoring() {
  if (_started || typeof window === 'undefined') {
    return
  }

  _started = true
  syncServerState()
  syncNotificationState()

  window.addEventListener('online', handleBrowserOnline)
  window.addEventListener('offline', handleBrowserOffline)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  subscribeToServerContextChange(() => {
    syncServerState()
    void runConnectionCheck()
  })

  window.setInterval(() => {
    void runConnectionCheck()
  }, POLL_INTERVAL_MS)

  void runConnectionCheck()
}

function handleVisibilityChange() {
  if (!document.hidden) {
    syncNotificationState()
    void runConnectionCheck()
  }
}

export async function emitPresentationStartedNotification(songTitle: string) {
  await showLocalNotification('Apresentação iniciada', {
    body: `"${songTitle}" foi enviada ao Holyrics.`,
    tag: 'presentation-started',
  })
}

export function useHolyricsConnection() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    startMonitoring()
  }, [])

  return {
    ...state,
    requestNotificationPermission: useCallback(async () => {
      const permission = await requestNotificationPermission()
      setState({ notificationPermission: permission })

      if (permission === 'granted') {
        toast.success('Notificações locais ativadas.')
      } else if (permission === 'denied') {
        toast.error('O navegador bloqueou as notificações para este app.')
      }

      return permission
    }, []),
    checkNow: useCallback(() => runConnectionCheck(), []),
  }
}
