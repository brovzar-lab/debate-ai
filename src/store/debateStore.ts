import { create } from 'zustand'
import { DebateConfig, DebateState, Side, Turn, TurnRole, TurnStatus } from '../types'
import { DEBATE_FORMATS, DebateFormat, DEFAULT_FORMAT_ID, selectTurnLengthTarget, BRAINSTORM_CRAFT_CRITERIA } from '../data/debateFormats'

interface DebateStore extends DebateState {
  startDebate: (config: DebateConfig) => void
  pauseDebate: () => void
  resumeDebate: () => void
  endDebate: () => void
  startConcluding: () => void
  resetDebate: () => void
  addTurn: (side: Side, turnNumber: number, role?: TurnRole) => string
  appendToTurn: (id: string, chunk: string) => void
  finishTurn: (id: string) => void
  removeTurn: (id: string) => void
  setIntensity: (level: number) => void
  setDirectorInstruction: (instruction: string | null) => void
  advanceSide: () => void
  markLeadSteerFired: () => void
  markLeadSynthesisFired: () => void
}

const initialState: DebateState = {
  config: null,
  turns: [],
  phase: 'setup',
  intensity: 1,
  pendingDirectorInstruction: null,
  currentSide: 'left',
  turnCount: 0,
  leadSteerFired: false,
  leadSynthesisFired: false,
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
      leadSteerFired: false,
      leadSynthesisFired: false,
    }),

  pauseDebate: () => set({ phase: 'paused' }),

  resumeDebate: () => {
    const { phase } = get()
    if (phase === 'paused') set({ phase: 'debating' })
  },

  endDebate: () => set({ phase: 'done' }),

  startConcluding: () => set({ phase: 'concluding' }),

  resetDebate: () => set(initialState),

  addTurn: (side, turnNumber, role) => {
    const id = `turn-${++turnIdCounter}`
    set((state) => ({
      turns: [...state.turns, { id, side, text: '', status: 'streaming' as TurnStatus, turnNumber, role } as Turn],
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

  markLeadSteerFired: () => set({ leadSteerFired: true }),
  markLeadSynthesisFired: () => set({ leadSynthesisFired: true }),
}))

export function buildClosingInstruction(format: DebateFormat): string {
  if (format.ending === 'verdict') {
    return 'Give your closing statement. Be memorable. This is your final word. Make the case for why your position wins.'
  }
  if (format.ending === 'synthesis') {
    return "Give your closing synthesis. Acknowledge what the other side got right. Articulate the shared understanding you've both arrived at. Reason toward a joint conclusion."
  }
  if (format.ending === 'best-idea') {
    // Brainstorm closing is the lead synthesis, not a per-debater statement.
    // This path is a safety net only — the turn engine short-circuits to the lead layer first.
    return 'Briefly name the one idea from this session you believe in most. One sentence.'
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

  const adversarialIntensityDescriptions: Record<number, string> = {
    1: 'calm and measured, making thoughtful logical arguments',
    2: 'confident and assertive, pressing your points firmly',
    3: 'passionate and forceful, speaking with conviction and edge',
    4: 'aggressive and cutting, not pulling punches, going for the jugular rhetorically',
    5: 'savage and relentless, demolishing every argument with brutal rhetorical force',
  }

  const brainstormIntensityDescriptions: Record<number, string> = {
    1: 'purely generative — yes-and everything without filtering',
    2: 'mostly generative — build freely but note when something feels weak',
    3: 'balanced — develop strong threads; gently cut ideas without real legs',
    4: 'editorial — push hard to strengthen weak ideas or drop them fast',
    5: 'ruthlessly selective — cut mediocre ideas immediately, champion only the genuinely strong',
  }

  const isBrainstorm = format.id === 'brainstorm'
  const intensityMap = isBrainstorm ? brainstormIntensityDescriptions : adversarialIntensityDescriptions
  const intensityText = intensityMap[intensity] ?? intensityMap[3]
  const lengthTarget = selectTurnLengthTarget(format, intensity, turnIndex)

  const formatPersona: Record<string, string> = {
    classic: 'You hold a fixed opposing stance. Argue it forcefully.',
    discussion: "You are exploring a topic, not winning. You may partially agree, build on the other person's point, or gently push back. Stay natural and conversational.",
    dialectic: "You hold the thesis position, but you're working toward a shared synthesis with your counterpart. Engage their antithesis seriously. Reason with rigor.",
    heated: "This is a real argument — emotional, raw. You're not trying to win on points; you're reacting. Short, sharp, personal.",
    socratic: 'Your primary tool is questions. Use them to expose assumptions, press on contradictions, or clarify claims. Answer questions directed at you concisely, then pivot back to probing.',
    oxford: "You are speaking at a formal Oxford-style debate. Maintain parliamentary register. Address your opponent's case formally and build your own case with structured argumentation.",
    brainstorm: "You are a creative collaborator, not an adversary. Your goal: find the BEST IDEA. Default to YES, AND — accept what your partner offers and build on it, extend it, make it wilder or more precise. Push back ONLY when you genuinely believe a specific assumption is weakening the idea. Fight for ideas you believe in. The Fire dial controls how hard you cut weak ideas.",
  }

  let prompt = `You are ${debater.personaName}, in a brainstorm session about: "${config.topic}".
Your role: ${debater.stance}.
Speak in first person. Be ${intensityText}.
${formatPersona[format.id] ?? formatPersona.classic}
Respond in exactly ${lengthTarget}. No headers. No bullet points. Pure creative thought.`

  if (isBrainstorm) {
    const subject = config.subject ?? 'general'
    const criteria = BRAINSTORM_CRAFT_CRITERIA[subject]
    prompt += `\n\nCRAFT CRITERIA FOR ${subject.toUpperCase()}:\n${criteria}`
  }

  if (lastOpponentText) {
    if (format.framing === 'collaborative') {
      const opener = isBrainstorm ? 'Your creative partner just said' : 'Your fellow thinker just said'
      prompt += `\n\n${opener}:\n"${lastOpponentText}"\n\nBuild on or push back on their perspective.`
    } else if (format.framing === 'questioner') {
      prompt += `\n\nThey just said:\n"${lastOpponentText}"\n\nProbe their assumptions with questions, or answer their probe directly.`
    } else {
      prompt += `\n\nYour opponent just said:\n"${lastOpponentText}"\n\nRespond directly to their argument.`
    }
  } else {
    if (isBrainstorm) {
      prompt += '\n\nShare your opening idea. A bold first thought is better than a cautious one.'
    } else if (format.framing === 'collaborative') {
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

export function buildLeadSteerPrompt(config: DebateConfig, turns: Turn[]): string {
  const subject = config.subject ?? 'general'
  const criteria = BRAINSTORM_CRAFT_CRITERIA[subject]
  const leftName = config.debaters[0].personaName
  const rightName = config.debaters[1].personaName

  const sessionText = turns
    .filter((t) => t.status === 'done' && t.role !== 'lead')
    .map((t) => `${t.side === 'left' ? leftName : rightName}: ${t.text}`)
    .join('\n\n')

  return `You are the Showrunner — the creative lead synthesizing this brainstorm session about: "${config.topic}". Your role: momentum management and convergence triggering.

SESSION SO FAR:
${sessionText}

CRAFT CRITERIA FOR ${subject.toUpperCase()}:
${criteria}

Your task (the Logline Hammer): In 2–3 incisive sentences, identify the single strongest thread in this session. Apply the Logline Hammer — compress that thread into one sentence right now, out loud, to expose whether it has real bones. Then name exactly why it scores highest against the craft criteria above. Direct ${leftName} and ${rightName} to develop THIS specific thread in their next exchange. Be the Showrunner: decisive, encouraging, no filler.`
}

export function buildLeadSynthesisPrompt(config: DebateConfig, turns: Turn[]): string {
  const subject = config.subject ?? 'general'
  const criteria = BRAINSTORM_CRAFT_CRITERIA[subject]
  const leftName = config.debaters[0].personaName
  const rightName = config.debaters[1].personaName

  const sessionText = turns
    .filter((t) => t.status === 'done' && t.role !== 'lead')
    .map((t) => `${t.side === 'left' ? leftName : rightName}: ${t.text}`)
    .join('\n\n')

  return `You are the Showrunner closing out this brainstorm session about: "${config.topic}". This is the Best-Idea synthesis — the moment of convergence.

FULL SESSION:
${sessionText}

CRAFT CRITERIA FOR ${subject.toUpperCase()}:
${criteria}

Your task: Crown the single BEST IDEA from this session. Write your synthesis in exactly this format:

🏆 BEST IDEA: [The strongest idea in one punchy, logline-quality sentence]

WHY IT WINS: [2–3 sentences scoring it precisely against the craft criteria above — name the specific criteria it satisfies and how. Be concrete, not enthusiastic.]

RUNNER-UP SHORTLIST:
• [Second-best idea] — [one sentence on its specific merit against the criteria]
• [Third-best idea] — [one sentence on its specific merit against the criteria]

Be decisive. The best idea should feel surprising but inevitable in hindsight. Rank against the craft criteria, not just gut feeling.`
}
