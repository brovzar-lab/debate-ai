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
// Source: CMO research, APPU-1441. Keep injections tight: top 4–6 criteria + 1–2 methodologies per domain.
export const BRAINSTORM_CRAFT_CRITERIA: Record<BrainstormSubject, string> = {
  film: `Film craft criteria (evaluate every idea against these):
1. Character engine — protagonist has a Wound (what broke them), a Want (conscious pursuit), and a Need (what would actually heal them). The film is the collision.
2. High Concept — can you pitch the whole film in one sentence that sells itself? It must feel both familiar and fresh (genre + twist). No logline = no premise.
3. "What if?" test — does the central premise create instant conflict AND instant curiosity? The best premises answer both in one breath.
4. Emotional truth — beneath the plot, what is this film really about? A specific, arguable point of view on being human.
5. Structural bones — the Catalyst (world-changing, cannot be undone) and All Is Lost moments must be viscerally clear.
6. Freshness — a new angle on familiar material, not a genre exercise. What has never been done in this territory?
Methodologies: Pixar Story Spine stress-test (Once upon a time... Until one day... Because of that... Until finally...); Genre Mashup — force-combine two genres and evaluate whether the collision creates something greater than its parts.`,

  screenplay: `Screenplay craft criteria (evaluate every concept against these):
1. Character-First — define the Wound (what broke them before page one), the Want (what they consciously chase), and the Need (what the story forces them to confront). The premise must emerge from character, not the other way around.
2. Inciting incident — a world-changing event on page ~12 that cannot be undone. If it can be undone, it's not an inciting incident.
3. Antagonist logic — the opposition must have an equally valid worldview. A villain who is merely evil is a weak screenplay.
4. Logline test — compress the concept into a single sentence: who wants what, what stands in the way, what's the cost? Vagueness in the logline = vagueness in the script.
5. Structural tension — each act raises the cost of failure. Act 3 must be the most expensive.
6. Specificity — details and dialogue only this story could have. Voice only this writer could possess.
Methodologies: Save the Cat 15-beat check (especially Catalyst + All Is Lost — if you can't identify these, the structure is soft); "What is this really about?" stress-test — strip the plot and state the theme in one sentence.`,

  tv: `TV series craft criteria (evaluate every concept against these):
1. The Engine — a repeatable situation that generates fresh conflict every episode without exhausting itself. The best series engines run for 5+ seasons.
2. Episode 2 test — does the premise still generate story without the pilot's setup? If episode 2 requires the pilot's exposition to work, the engine is weak.
3. Series Question — a burning central question audiences need answered (but not too soon). The series ends when the question is answered or permanently deferred.
4. Character web — at least 3 relationships with built-in tension that can evolve across seasons without resolution feeling like an ending.
5. World rules — specific rituals, language, and hierarchy that reward close watching and create insider knowledge for loyal viewers.
6. Franchise depth — a universe that can expand (spinoffs, timelines, POV shifts) without losing its soul.
Methodologies: TV Writers' Room mechanics — pitch freely, no idea too stupid, track the best threads on a yes-board, everyone works the same structural problem together; Season-arc sketch — can you outline the core tension of seasons 1, 2, and 3 in two sentences each?`,

  startup: `Startup idea criteria (evaluate every concept against these):
1. Jobs to Be Done — what specific job is this hired to do, and who is hiring it? "People don't buy products; they hire them." If the JTBD is vague, the market is vague.
2. Problem intensity — a real, acute pain felt by a clearly defined audience. Vitamins lose to painkillers. Is this a painkiller?
3. Why Now — a recent shift (regulatory, technological, behavioral, cultural) that makes this moment the right one. Why didn't this exist five years ago?
4. Unfair advantage — technology, network, data, brand, or insight that competitors cannot easily replicate. Without this, you're a feature, not a company.
5. Wedge — a specific beachhead where you can win before expanding. The best startups own a small market completely before expanding.
6. Mom Test — would real users describe their current behavior in a way that validates this problem? Never ask "do you like this idea?" — ask about actual behavior.
Methodologies: First Principles breakdown — strip the idea to its irreducible truths, remove all assumptions, rebuild from the ground up. What is actually true here?; Blue Ocean test — what uncontested space does this occupy that existing players have ignored or dismissed?`,

  business: `Business idea criteria (evaluate every concept against these):
1. Customer obsession — a crystal-clear target customer (specific person, specific context) and their underserved need. "Everyone" is not a customer.
2. Differentiation — a compelling reason to choose this over every alternative, including doing nothing. The test: why switch?
3. Moat — something that compounds over time: brand loyalty, network effects, proprietary data, switching costs, regulatory position. Without a moat, margins collapse.
4. Unit economics — a credible path to profitable transactions at scale. If the unit economics don't work at 100 customers, they won't work at 1 million.
5. Distribution — a clear, efficient channel to reach customers. The best product loses to the best distribution.
6. Blue Ocean — what uncontested market space does this occupy? Stop competing in crowded red oceans; find the territory others have overlooked.
Methodologies: "How Might We...?" reframing — turn every weakness into an opportunity question ("HMW solve X without requiring Y?"); Jobs to Be Done stress-test — what job are customers really hiring this business to do, and what are the emotional + functional + social dimensions of that job?`,

  general: `Core idea criteria (evaluate every concept against these):
1. Core insight — can you state the essential idea in one sentence? If not, it isn't clear yet.
2. Novelty — a genuinely new combination, perspective, or approach. What makes this different from what already exists?
3. Feasibility — executable with available resources and real-world constraints. An idea that requires perfect conditions is not an idea; it's a wish.
4. Stakes — does pursuing this idea have meaningful cost, consequence, or irreversibility? Ideas without stakes have no urgency.
5. Impact — solves a meaningful problem or creates lasting value for a real audience. Who is better off because of this idea, and how much better off?
6. Memorability — it sticks; you can explain it to anyone in 30 seconds and they can repeat it back accurately.
Methodologies: SCAMPER — Substitute, Combine, Adapt, Modify/Magnify, Put to other uses, Eliminate, Reverse — apply each lens to generate variants beyond first instinct; Six Thinking Hats rapid switch — White (facts: what do we actually know?), Red (gut: does this feel exciting?), Black (caution: what could go wrong?), Yellow (optimism: best-case interpretation?), Green (generative: what new angles?).`,
}
