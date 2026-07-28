import type { DebateFormatId, BrainstormSubject } from './data/debateFormats'
export type { DebateFormatId, BrainstormSubject }

export interface Model {
  id: string
  name: string
  provider: string
  openrouterId: string
  color: string
  emoji: string
}

export type Side = 'left' | 'right'
export type DebatePhase = 'setup' | 'debating' | 'paused' | 'concluding' | 'done'

export interface Persona {
  name: string
  systemPromptFragment: string
}

export interface Debater {
  side: Side
  model: Model
  personaName: string
  stance: string
  voiceId?: string
  persona?: Persona
}

export interface DebateConfig {
  topic: string
  debaters: [Debater, Debater]
  intensity: number
  turnCap: number
  format: DebateFormatId
  subject?: BrainstormSubject
}

export type TurnStatus = 'streaming' | 'done'
export type TurnRole = 'debater' | 'lead'

export interface Turn {
  id: string
  side: Side
  text: string
  status: TurnStatus
  turnNumber: number
  role?: TurnRole
}

export interface DebateState {
  config: DebateConfig | null
  turns: Turn[]
  phase: DebatePhase
  intensity: number
  pendingDirectorInstruction: string | null
  currentSide: Side
  turnCount: number
  leadSteerFired: boolean
  leadSynthesisFired: boolean
}

export interface DirectorAction {
  type: 'provoke' | 'wrap_up' | 'set_intensity' | 'stop' | 'resume'
  payload?: number | string
}

// Shared interface for APPU-1423 voice integration — Web II binds to this
export interface VoiceSpeakerState {
  activeSide: Side | null
  isSpeaking: boolean
}
