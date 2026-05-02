import { useState, useCallback, useEffect } from 'react'
import { subscribeToServerContextChange } from '@/lib/server-context-events'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { getServerSetupKey } from '@/lib/server-storage'

export type SetupStep = 'songs' | 'themes' | 'playlists' // | 'images' | 'videos' | 'audios' (to be added later)

export interface SetupStepConfig {
  id: SetupStep
  label: string
  description: string
  icon: string
}

export const SETUP_STEPS: SetupStepConfig[] = [
  {
    id: 'songs',
    label: 'Músicas',
    description: 'Sincronizar biblioteca de músicas do Holyrics',
    icon: '🎵',
  },
  {
    id: 'themes',
    label: 'Temas',
    description: 'Sincronizar biblioteca de temas e backgrounds',
    icon: '🖼️',
  },
  {
    id: 'playlists',
    label: 'Playlists',
    description: 'Sincronizar listas de reprodução salvas',
    icon: '📋',
  },
]

export interface SetupState {
  completed: SetupStep[]
  dismissed: boolean
  setupCompletedAt: string | null
}

function loadSetupState(serverId?: string | null): SetupState {
  const resolvedServerId = serverId ?? getCurrentActiveServer()?.id
  if (!resolvedServerId) {
    return { completed: [], dismissed: false, setupCompletedAt: null }
  }

  try {
    const raw = localStorage.getItem(getServerSetupKey(resolvedServerId))
    if (raw) return JSON.parse(raw) as SetupState
  } catch {
    // ignore
  }
  return { completed: [], dismissed: false, setupCompletedAt: null }
}

function saveSetupState(state: SetupState, serverId?: string | null) {
  const resolvedServerId = serverId ?? getCurrentActiveServer()?.id
  if (!resolvedServerId) {
    return
  }

  try {
    localStorage.setItem(getServerSetupKey(resolvedServerId), JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function useSetupStore() {
  const [setupState, setSetupState] = useState<SetupState>(() => loadSetupState())

  useEffect(() => {
    return subscribeToServerContextChange(({ serverId }) => {
      setSetupState(loadSetupState(serverId))
    })
  }, [])

  const markStepCompleted = useCallback((step: SetupStep) => {
    setSetupState((prev) => {
      const completed = prev.completed.includes(step)
        ? prev.completed
        : [...prev.completed, step]

      const allDone = SETUP_STEPS.every((s) => completed.includes(s.id))
      const next: SetupState = {
        ...prev,
        completed,
        setupCompletedAt: allDone ? new Date().toISOString() : prev.setupCompletedAt,
      }
      saveSetupState(next)
      return next
    })
  }, [])

  const dismissSetup = useCallback(() => {
    setSetupState((prev) => {
      const next: SetupState = { ...prev, dismissed: true }
      saveSetupState(next)
      return next
    })
  }, [])

  const resetSetup = useCallback(() => {
    const next: SetupState = { completed: [], dismissed: false, setupCompletedAt: null }
    saveSetupState(next)
    setSetupState(next)
  }, [])

  const isStepCompleted = useCallback(
    (step: SetupStep) => setupState.completed.includes(step),
    [setupState.completed]
  )

  const isSetupComplete = SETUP_STEPS.every((s) => setupState.completed.includes(s.id))
  const needsSetup = !isSetupComplete && !setupState.dismissed

  return {
    ...setupState,
    isStepCompleted,
    isSetupComplete,
    needsSetup,
    markStepCompleted,
    dismissSetup,
    resetSetup,
  }
}
