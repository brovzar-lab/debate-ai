export type DebateFormatId = 'classic' | 'discussion' | 'dialectic' | 'heated' | 'socratic' | 'oxford' | 'brainstorm'
export type BrainstormSubject = 'film' | 'screenplay' | 'tv' | 'startup' | 'business' | 'general'

export type DebateFraming = 'adversarial' | 'collaborative' | 'questioner'
export type DebateEnding = 'verdict' | 'synthesis' | 'open' | 'best-idea'
export type TurnRhythm = 'short' | 'mixed' | 'long' | 'brainstorm'

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
  brainstorm: {
    id: 'brainstorm',
    label: 'Brainstorm',
    emoji: '💡',
    blurb: 'Collaborative yes-and ideation. Two partners build toward the best idea, guided by a craft-criteria lead.',
    framing: 'collaborative',
    turnRhythm: 'brainstorm',
    ending: 'best-idea',
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
  short:      [0, 1, 1, 0, 2, 1, 0, 1],
  mixed:      [2, 1, 3, 0, 2, 1, 3, 2],
  long:       [3, 2, 3, 1, 3, 2, 3, 2],
  brainstorm: [1, 0, 1, 2, 1, 1, 3, 0], // mostly quick yes-ands; occasional develops at indices 3 and 6
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

export const BRAINSTORM_SUBJECTS: { id: BrainstormSubject; label: string; emoji: string }[] = [
  { id: 'film',       label: 'Film',       emoji: '🎬' },
  { id: 'screenplay', label: 'Screenplay', emoji: '✍️' },
  { id: 'tv',         label: 'TV Series',  emoji: '📺' },
  { id: 'startup',    label: 'Startup',    emoji: '🚀' },
  { id: 'business',   label: 'Business',   emoji: '💼' },
  { id: 'general',    label: 'Anything',   emoji: '✨' },
]

// Craft-criteria packs injected into every brainstorm turn's system prompt.
// Scaffold — APPU-1441 (CMO research) will replace these with real, deeply-researched packs.
export const BRAINSTORM_CRAFT_CRITERIA: Record<BrainstormSubject, string> = {
  film: `What makes a great film idea:
1. Premise — a fresh "what if" that's immediately graspable yet genuinely unexpected
2. Emotional core — a central want vs. need that drives the protagonist toward transformation
3. Conflict — irresolvable tension that forces character change
4. Theme — a specific, arguable point of view on the human condition
5. Originality — a new angle on familiar material, not just a genre exercise
6. Marketability — a clear audience and a visceral one-line hook
Methodologies: yes-and (generate before filtering), Save the Cat beat sheet, Pixar story spine test.`,

  screenplay: `What makes a great screenplay concept:
1. Inciting incident — a world-changing event that cannot be undone
2. Want vs. need — the hero pursues the wrong thing; the audience sees what they actually need
3. Antagonist logic — the opposition has an equally valid worldview
4. Structural tension — each act raises the cost of failure
5. Specificity — a world rendered in telling, precise details only this story could have
6. Voice — a distinctive narrative POV that couldn't belong to anyone else
Methodologies: Save the Cat beat sheet, Pixar story spine, "what is this really about?" stress-test.`,

  tv: `What makes a great TV series concept:
1. Engine — a repeatable situation that generates fresh conflict every episode
2. Character web — relationships with built-in tension that evolve meaningfully across seasons
3. World — rules, rituals, and language that reward close watching
4. Series question — a burning question audiences need answered (but not too soon)
5. Stakes escalation — each season raises what's at risk without feeling manufactured
6. Franchise potential — a universe that can expand without losing its soul
Methodologies: yes-and pilot concept, episode-2 stress-test (does the engine still run?), season-arc sketch.`,

  startup: `What makes a great startup idea:
1. Problem intensity — a real pain felt acutely by a clearly defined audience
2. Market size — a large or fast-growing opportunity worth pursuing
3. Wedge — a specific beachhead where you can win before expanding
4. Unfair advantage — technology, network, data, or insight competitors can't easily replicate
5. Why now — a recent shift (regulatory, technological, behavioral) that makes this the moment
6. Business model clarity — a credible path to value capture at scale
Methodologies: jobs-to-be-done, 10x-not-10% test, first-principles breakdown.`,

  business: `What makes a great business idea:
1. Customer obsession — a crystal-clear target customer and their underserved need
2. Differentiation — a compelling reason to choose this over every alternative
3. Unit economics — a path to profitable transactions at scale
4. Distribution — a clear channel to reach customers efficiently
5. Moat — something that compounds over time (brand, network, data, process)
6. Timing — why this business works better now than it did five years ago
Methodologies: design thinking (empathize → define → ideate), jobs-to-be-done, Porter's Five Forces stress-test.`,

  general: `What makes a great idea:
1. Novelty — a genuinely new combination or perspective
2. Feasibility — executable with available resources and real-world constraints
3. Impact — solves a meaningful problem or creates lasting value
4. Simplicity — the core insight can be stated in one sentence
5. Memorability — it sticks; you can explain it to anyone in 30 seconds
6. Timing — the world is ready for it now
Methodologies: yes-and (build before filtering), SCAMPER (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse), "what would make this 10x better?" push.`,
}
