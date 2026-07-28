import { create } from 'zustand'
import { DebateConfig, DebateState, Side, TurnStatus } from '../types'
import { DEBATE_FORMATS, DebateFormat, DEFAULT_FORMAT_ID, selectTurnLengthTarget } from '../data/debateFormats'

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
  removeTurn: (id: string) => void
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

  removeTurn: (id) =>
    set((state) => ({
      turns: state.turns.filter((t) => t.id !== id),
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

export function buildClosingInstruction(format: DebateFormat): string {
  if (format.ending === 'verdict') {
    return 'Give your closing statement. Be memorable. This is your final word. Make the case for why your position wins.'
  }
  if (format.ending === 'synthesis') {
    return "Give your closing synthesis. Acknowledge what the other side got right. Articulate the shared understanding you've both arrived at. Reason toward a joint conclusion."
  }
  // open ending
  if (format.id === 'discussion') {
    return "Share where you've landed. What did this conversation change or confirm for you? Keep it personal and honest — no winner, just your honest takeaway."
  }
  if (format.id === 'socratic') {
    return 'The dialogue has run its course. Briefly state whether your position has been refined, challenged, or collapsed by the questioning. Be direct.'
  }
  // heated + fallback
  return 'Wrap it up. Short. Raw. No formal verdict — just your parting shot.'
}

export function buildSystemPrompt(
  config: DebateConfig,
  side: Side,
  intensity: number,
  directorInstruction: string | null,
  lastOpponentText: string | null,
  turnIndex = 0
): string {
  const debater = config.debaters[side === 'left' ? 0 : 1]
  const format = DEBATE_FORMATS[config.format ?? DEFAULT_FORMAT_ID]

  const intensityDescriptions: Record<number, string> = {
    1: 'calm and measured, making thoughtful logical arguments',
    2: 'confident and assertive, pressing your points firmly',
    3: 'passionate and forceful, speaking with conviction and edge',
    4: 'aggressive and cutting, not pulling punches, going for the jugular rhetorically',
    5: 'savage and relentless, demolishing every argument with brutal rhetorical force',
  }

  const intensityText = intensityDescriptions[intensity] ?? intensityDescriptions[3]
  const lengthTarget = selectTurnLengthTarget(format, intensity, turnIndex)

  const formatPersona: Record<string, string> = {
    classic: 'You hold a fixed opposing stance. Argue it forcefully.',
    discussion: "You are exploring a topic, not winning. You may partially agree, build on the other person's point, or gently push back. Stay natural and conversational.",
    dialectic: "You hold the thesis position, but you're working toward a shared synthesis with your counterpart. Engage their antithesis seriously. Reason with rigor.",
    heated: "This is a real argument — emotional, raw. You're not trying to win on points; you're reacting. Short, sharp, personal.",
    socratic: 'Your primary tool is questions. Use them to expose assumptions, press on contradictions, or clarify claims. Answer questions directed at you concisely, then pivot back to probing.',
    oxford: 'You are speaking at a formal Oxford-style debate. Maintain parliamentary register. Address your opponent\'s case formally and build your own case with structured argumentation.',
  }

  let prompt = `You are ${debater.personaName}, debating the topic: "${config.topic}".
Your position: ${debater.stance}.
Speak in first person. Be ${intensityText}.
${formatPersona[format.id] ?? formatPersona.classic}
Respond in exactly ${lengthTarget}. No headers. No bullet points. Pure rhetoric.`

  if (lastOpponentText) {
    if (format.framing === 'collaborative') {
      prompt += `\n\nYour fellow thinker just said:\n"${lastOpponentText}"\n\nBuild on or push back on their perspective.`
    } else if (format.framing === 'questioner') {
      prompt += `\n\nThey just said:\n"${lastOpponentText}"\n\nProbe their assumptions with questions, or answer their probe directly.`
    } else {
      prompt += `\n\nYour opponent just said:\n"${lastOpponentText}"\n\nRespond directly to their argument.`
    }
  } else {
    if (format.framing === 'collaborative') {
      prompt += '\n\nShare your opening perspective.'
    } else if (format.framing === 'questioner') {
      prompt += '\n\nBegin by probing the core assumption of the topic with a question.'
    } else {
      prompt += '\n\nMake your opening argument.'
    }
  }

  if (directorInstruction) {
    prompt += `\n\n[DIRECTOR INSTRUCTION]: ${directorInstruction}`
  }

  return prompt
}
