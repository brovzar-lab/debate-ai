import { create } from 'zustand'
import type { Side } from '../types'

interface VoiceState {
  enabled: boolean
  leftMuted: boolean
  rightMuted: boolean
  speakingSide: Side | null
}

interface VoiceStore extends VoiceState {
  setEnabled: (v: boolean) => void
  toggleEnabled: () => void
  setLeftMuted: (v: boolean) => void
  setRightMuted: (v: boolean) => void
  setSpeakingSide: (side: Side | null) => void
  reset: () => void
}

const initialState: VoiceState = {
  enabled: true,
  leftMuted: false,
  rightMuted: false,
  speakingSide: null,
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...initialState,

  setEnabled: (v) => set({ enabled: v }),
  toggleEnabled: () => set((s) => ({ enabled: !s.enabled })),
  setLeftMuted: (v) => set({ leftMuted: v }),
  setRightMuted: (v) => set({ rightMuted: v }),
  setSpeakingSide: (side) => set({ speakingSide: side }),
  reset: () => set(initialState),
}))
