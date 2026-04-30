import { useState, useCallback, useEffect } from 'react'

export type SetupStep = 'songs' // | 'images' | 'videos' | 'audios' (to be added later)

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
  // Future steps:
  // { id: 'images', label: 'Imagens', description: 'Sincronizar imagens e backgrounds', icon: '🖼️' },
  // { id: 'videos', label: 'Vídeos', description: 'Sincronizar biblioteca de vídeos', icon: '🎬' },
  // { id: 'audios', label: 'Áudios', description: 'Sincronizar biblioteca de áudios', icon: '🔊' },
]

export interface SetupState {
  completed: SetupStep[]
  dismissed: boolean
  setupCompletedAt: string | null
}

const STORAGE_KEY = 'holyrics:setup'

function loadSetupState(): SetupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SetupState
  } catch {
    // ignore
  }
  return { completed: [], dismissed: false, setupCompletedAt: null }
}

function saveSetupState(state: SetupState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function useSetupStore() {
  const [setupState, setSetupState] = useState<SetupState>(loadSetupState)

  useEffect(() => {
    setSetupState(loadSetupState())
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
