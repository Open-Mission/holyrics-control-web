const SERVER_CONTEXT_EVENT = 'holyrics:server-context-change'

export type ServerContextChangeReason =
  | 'bootstrap'
  | 'switch'
  | 'create'
  | 'update'
  | 'remove'
  | 'cleanup'

export interface ServerContextChangeDetail {
  serverId: string | null
  previousServerId: string | null
  reason: ServerContextChangeReason
}

function getServerContextTarget() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!window.__holyricsServerContextTarget) {
    window.__holyricsServerContextTarget = new EventTarget()
  }

  return window.__holyricsServerContextTarget
}

declare global {
  interface Window {
    __holyricsServerContextTarget?: EventTarget
  }
}

export function emitServerContextChange(detail: ServerContextChangeDetail) {
  const target = getServerContextTarget()
  if (!target) return

  target.dispatchEvent(new CustomEvent(SERVER_CONTEXT_EVENT, { detail }))
}

export function subscribeToServerContextChange(
  listener: (detail: ServerContextChangeDetail) => void
) {
  const target = getServerContextTarget()
  if (!target) {
    return () => {}
  }

  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<ServerContextChangeDetail>
    listener(customEvent.detail)
  }

  target.addEventListener(SERVER_CONTEXT_EVENT, handleEvent)
  return () => {
    target.removeEventListener(SERVER_CONTEXT_EVENT, handleEvent)
  }
}
