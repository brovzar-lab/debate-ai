import { useState, useEffect } from 'react'
import { Model } from '../types'
import { MODELS } from '../data/models'
import { isDemoMode } from '../lib/demo'

interface AvailableModelsState {
  models: Model[]
  loading: boolean
  unavailableCount: number
}

export function useAvailableModels(): AvailableModelsState {
  const demo = isDemoMode()
  const [state, setState] = useState<AvailableModelsState>({
    models: demo ? MODELS : [],
    loading: !demo,
    unavailableCount: 0,
  })

  useEffect(() => {
    if (demo) return

    let cancelled = false

    async function validate() {
      try {
        const available = await fetchAvailableModelIds()
        if (cancelled) return
        const validated = MODELS.filter((m) => available.has(m.openrouterId))
        setState({
          models: validated.length > 0 ? validated : MODELS,
          loading: false,
          unavailableCount: MODELS.length - Math.min(validated.length, MODELS.length),
        })
      } catch {
        // If validation fails entirely, fall back to the full curated list so
        // the user is not left with an empty palette.
        if (!cancelled) setState({ models: MODELS, loading: false, unavailableCount: 0 })
      }
    }

    validate()
    return () => {
      cancelled = true
    }
  }, [demo])

  return state
}

async function fetchAvailableModelIds(): Promise<Set<string>> {
  // Try server proxy first (keeps any future auth server-side).
  try {
    const res = await fetch('/api/models')
    if (res.ok) {
      const data = (await res.json()) as { available?: string[] }
      if (Array.isArray(data.available)) {
        return new Set(data.available)
      }
    }
  } catch {
    // fall through to direct call
  }

  // Fallback: call OpenRouter directly (handles BYO-key users in local dev where
  // the serverless functions aren't running).
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'HTTP-Referer': window.location.origin },
  })
  if (!res.ok) throw new Error('Cannot fetch model list')
  const data = (await res.json()) as { data?: Array<{ id: string }> }
  return new Set((data.data ?? []).map((m) => m.id))
}
