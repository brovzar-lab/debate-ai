export type DebateFormatId = 'classic' | 'discussion' | 'dialectic' | 'heated' | 'socratic' | 'oxford'

export type DebateFraming = 'adversarial' | 'collaborative' | 'questioner'
export type DebateEnding = 'verdict' | 'synthesis' | 'open'
export type TurnRhythm = 'short' | 'mixed' | 'long'

export interface DebateFormat {
  id: DebateFormatId
  label: string
  emoji: string
  blurb: string
  framing: DebateFraming
  turnRhythm: TurnRhythm
  ending: DebateEnding
}

export const DEBATE_FORMATS: Record<DebateFormatId, DebateFormat> = {
  classic: {
    id: 'classic',
    label: 'Classic Debate',
    emoji: '⚔️',
    blurb: 'Two fixed opposing stances, point/counterpoint.',
    framing: 'adversarial',
    turnRhythm: 'mixed',
    ending: 'verdict',
  },
  discussion: {
    id: 'discussion',
    label: 'Open Discussion',
    emoji: '💬',
    blurb: 'Two perspectives explore a topic — can partly agree, build on each other.',
    framing: 'collaborative',
    turnRhythm: 'short',
    ending: 'open',
  },
  dialectic: {
    id: 'dialectic',
    label: 'Thesis → Antithesis → Synthesis',
    emoji: '☯️',
    blurb: 'Hegelian dialectic. Both sides deliberately drive toward a shared synthesis.',
    framing: 'collaborative',
    turnRhythm: 'long',
    ending: 'synthesis',
  },
  heated: {
    id: 'heated',
    label: 'Heated Argument',
    emoji: '🔥',
    blurb: 'Informal, emotional — short jabs dominate. Fire dial bites harder.',
    framing: 'adversarial',
    turnRhythm: 'short',
    ending: 'open',
  },
  socratic: {
    id: 'socratic',
    label: 'Socratic Dialogue',
    emoji: '🏛️',
    blurb: "Question-driven. One probes the other's assumptions; roles swap.",
    framing: 'questioner',
    turnRhythm: 'short',
    ending: 'open',
  },
  oxford: {
    id: 'oxford',
    label: 'Oxford / Parliamentary',
    emoji: '🎩',
    blurb: 'Formal motion. Proposition vs Opposition. Structured register.',
    framing: 'adversarial',
    turnRhythm: 'long',
    ending: 'verdict',
  },
}

export const DEFAULT_FORMAT_ID: DebateFormatId = 'classic'

// Length target labels, indexed 0 (shortest) → 3 (longest).
const LENGTH_TARGETS = [
  'ONE sharp sentence',
  'a tight 2–3 sentence jab',
  'one focused paragraph',
  'a developed 2–3 paragraph point',
] as const

// 8-element rotation per rhythm; index into LENGTH_TARGETS.
const RHYTHM_PATTERN: Record<TurnRhythm, readonly number[]> = {
  short: [0, 1, 1, 0, 2, 1, 0, 1],
  mixed: [2, 1, 3, 0, 2, 1, 3, 2],
  long:  [3, 2, 3, 1, 3, 2, 3, 2],
}

export function selectTurnLengthTarget(
  format: DebateFormat,
  intensity: number,
  turnIndex: number
): string {
  const pattern = RHYTHM_PATTERN[format.turnRhythm]
  let idx = pattern[turnIndex % pattern.length]

  // Higher intensity → shorter / sharper
  if (intensity >= 4) idx = Math.min(idx, 1)
  else if (intensity >= 3) idx = Math.min(idx, 2)

  return LENGTH_TARGETS[idx]
}
