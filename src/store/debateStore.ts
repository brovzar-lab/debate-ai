import { create } from 'zustand'
import { DebateConfig, DebatePhase, DebateState, Side, Turn, TurnStatus } from '../types'

interface DebateStore extends DebateState {
  startDebate: (config: DebateConfig) => void
  pauseDebate: () => void
  resumeDebate: () => void
  endDebate: () => void
  startConcluding: () => void
  resetDebate: () => void
  addTurn: (side: Side, turnNumber: number) => string
  appendToTurn: (id: string, chunk: string) => void
  finishTurn: (id: string) => void
  setIntensity: (level: number) => void
  setDirectorInstruction: (instruction: string | null) => void
  advanceSide: () => void
}

const initialState: DebateState = {
  config: null,
  turns: [],
  phase: 'setup',
  intensity: 1,
  pendingDirectorInstruction: null,
  currentSide: 'left',
  turnCount: 0,
}

let turnIdCounter = 0

export const useDebateStore = create<DebateStore>((set, get) => ({
  ...initialState,

  startDebate: (config) =>
    set({
      config,
      turns: [],
      phase: 'debating',
      intensity: config.intensity,
      pendingDirectorInstruction: null,
      currentSide: 'left',
      turnCount: 0,
    }),

  pauseDebate: () => set({ phase: 'paused' }),

  resumeDebate: () => {
    const { phase } = get()
    if (phase === 'paused') set({ phase: 'debating' })
  },

  endDebate: () => set({ phase: 'done' }),

  startConcluding: () => set({ phase: 'concluding' }),

  resetDebate: () => set(initialState),

  addTurn: (side, turnNumber) => {
    const id = `turn-${++turnIdCounter}`
    set((state) => ({
      turns: [...state.turns, { id, side, text: '', status: 'streaming' as TurnStatus, turnNumber }],
    }))
    return id
  },

  appendToTurn: (id, chunk) =>
    set((state) => ({
      turns: state.turns.map((t) => (t.id === id ? { ...t, text: t.text + chunk } : t)),
    })),

  finishTurn: (id) =>
    set((state) => ({
      turns: state.turns.map((t) => (t.id === id ? { ...t, status: 'done' as TurnStatus } : t)),
    })),

  setIntensity: (level) => set({ intensity: Math.min(5, Math.max(1, level)) }),

  setDirectorInstruction: (instruction) => set({ pendingDirectorInstruction: instruction }),

  advanceSide: () =>
    set((state) => ({
      currentSide: state.currentSide === 'left' ? 'right' : 'left',
      turnCount: state.turnCount + 1,
      pendingDirectorInstruction: null,
    })),
}))

export function buildSystemPrompt(
  config: DebateConfig,
  side: Side,
  intensity: number,
  directorInstruction: string | null,
  lastOpponentText: string | null
): string {
  const debater = config.debaters[side === 'left' ? 0 : 1]
  const intensityDescriptions: Record<number, string> = {
    1: 'calm and measured, making thoughtful logical arguments',
    2: 'confident and assertive, pressing your points firmly',
    3: 'passionate and forceful, speaking with conviction and edge',
    4: 'aggressive and cutting, not pulling punches, going for the jugular rhetorically',
    5: 'savage and relentless, demolishing every argument with brutal rhetorical force',
  }

  const intensityText = intensityDescriptions[intensity] ?? intensityDescriptions[3]

  let prompt = `You are ${debater.personaName}, debating the topic: "${config.topic}".
Your position: ${debater.stance}.
Speak in first person. Be ${intensityText}.
Keep your response to 2-4 focused, punchy paragraphs. No headers. No bullet points. Pure rhetoric.`

  if (lastOpponentText) {
    prompt += `\n\nYour opponent just said:\n"${lastOpponentText}"\n\nRespond directly to their argument.`
  } else {
    prompt += '\n\nMake your opening argument.'
  }

  if (directorInstruction) {
    prompt += `\n\n[DIRECTOR INSTRUCTION]: ${directorInstruction}`
  }

  return prompt
}
