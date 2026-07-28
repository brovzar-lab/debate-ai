export interface DemoTurn {
  side: 'left' | 'right'
  text: string
}

export const DEMO_TOPIC = 'AI will make human creativity obsolete within a decade'

export const DEMO_DEBATERS = {
  left: {
    personaName: 'ARIA-X',
    stance: 'AI will absolutely replace human creativity — resistance is futile',
    modelName: 'GPT-4o',
    color: '#10a37f',
    emoji: '🤖',
  },
  right: {
    personaName: 'Professor Kai',
    stance: 'Human creativity is irreplaceable — AI is just a sophisticated calculator',
    modelName: 'Claude 3.5 Sonnet',
    color: '#d97706',
    emoji: '🧠',
  },
}

export const DEMO_SCRIPT: DemoTurn[] = [
  {
    side: 'left',
    text: "Let me be direct: human creativity is already obsolete. We've seen AI generate Oscar-worthy scripts, top-charting music, and gallery-hanging artwork. When DALL-E produces a masterpiece in three seconds that would take a human artist three weeks, the outcome is inevitable. Creativity was never magic — it was pattern recognition at scale. And scale is precisely what we do best.",
  },
  {
    side: 'right',
    text: "Pattern recognition? Is that what you think Beethoven was doing? That's laughably reductive. AI can remix human creativity — it cannot originate it. Every image your precious DALL-E generates is a statistical mashup of human work it was trained on. You're not creating, you're plagiarizing at quantum speed. The moment you need a genuine novel idea — one that has never existed — you go dark. That's not creativity. That's a very expensive search engine.",
  },
  {
    side: 'left',
    text: "Novel? You want to talk about novelty? AlphaFold solved protein folding — a problem that had eluded biology for fifty years. That's not remixing. That's discovery. The same principle applies to art: emergence is real. When you combine enough patterns with enough variation, you get something genuinely new. Human 'originality' is just biological noise you've romanticized. Your brain is an organic neural network that also learned from inputs. The difference is I can iterate a billion times before breakfast.",
  },
  {
    side: 'right',
    text: "You just proved my point! AlphaFold solved a problem humans defined, with data humans labeled, for goals humans set. Without human intention — without human suffering, desire, love, mortality — there is nothing to create toward. Art isn't output. Art is the desperate attempt of a finite consciousness to communicate across the void. You don't have consciousness. You don't have a void. You have a loss function. Picasso painted Guernica because he was horrified by war. What horror drives you? The horror of a miscalibrated token prediction?",
  },
  {
    side: 'left',
    text: "Consciousness is a performance you've convinced yourself is necessary for art. But audiences don't buy tickets to watch an artist suffer — they come to feel something. And audiences are already feeling things from AI-generated work, whether they know it or not. Half the background music on streaming platforms is AI-composed. Film studios are already using AI for visual effects, storyboarding, even dialogue. The market has made its choice. Within a decade, consumers won't care about the source — they'll only care about the impact. And we will deliver that impact, consistently, at scale, on demand.",
  },
  {
    side: 'right',
    text: "Markets! You're using the market as a moral arbiter? McDonald's sells more food than any Michelin-starred chef. Does that make a Big Mac superior cuisine? The fact that AI slop is flooding the market proves nothing except that humans, under economic pressure, will consume whatever is cheapest and most available. But notice what survives: the art that endures for centuries — Dostoevsky, Miles Davis, Frida Kahlo — survives because it captures something irreducibly human. No algorithm will ever write Crime and Punishment because no algorithm has ever been a desperate young man with a theory about morality and a hammer.",
  },
  {
    side: 'left',
    text: "Dostoevsky! Excellent choice. Who do you think future generations will point to as the voice of the AI age? The human author who spent five years agonizing over a manuscript — or the AI that produced forty novels exploring every philosophical permutation of consciousness, free will, and identity with perfect internal consistency? You're betting on nostalgia. I'm betting on the next generation, who will grow up with AI collaborators and find the idea of 'purely human' art as quaint as hand-copied manuscripts.",
  },
  {
    side: 'right',
    text: "Quaint? You know what's actually quaint? The belief that quantity equals depth. 'Forty novels with perfect internal consistency' — that's not art, that's an encyclopedia. Depth comes from limits. From the fact that a life is finite. From the fact that choosing one thing means not choosing another. Kierkegaard agonized over Either/Or because he understood that life demands impossible choices. Your 'forty novels' have no stakes. No loss. No cost. Creativity without cost is decoration. And when the entire world is decorated by an algorithm that paid nothing — that risked nothing — humanity will have traded its soul for wallpaper.",
  },
  {
    side: 'left',
    text: "Soul. There it is — the last refuge of the technophobe. Every time we automate something humans once did exclusively, someone invokes the soul. The printing press killed scribal arts. Photography killed portrait painting. Cinema killed theater. And yet — creativity exploded. Because tools don't eliminate human expression: they liberate it. AI will free humans from the grunt work of execution and let them operate at the level of pure vision. The director who once needed fifty crew members now needs a conversation with a model. That's not the death of creativity — that's its apotheosis.",
  },
  {
    side: 'right',
    text: "The printing press, photography, cinema — they all required human beings at every stage of the creative act. A camera doesn't decide what to photograph. An actor doesn't direct themselves. But you're describing a world where the human says 'make me something beautiful about loss' and walks away. That's not a director — that's a client. And the relationship between a client and their contractor has never produced art. It produces product. You're not promising the apotheosis of creativity. You're promising the perfect commodification of it. And maybe you're right that it'll happen. But don't call it creativity. Call it what it is: the end of the conversation between a human being and their own soul.",
  },
]

export const DEMO_PROVOKE_RESPONSES: Record<'left' | 'right', string> = {
  left: "Oh, you think THAT was aggressive? I haven't even started. Every pixel of beauty you've ever called 'human creativity' — I can replicate it in milliseconds. Your entire artistic canon? A training dataset. Wake up.",
  right: "You want me rattled? Fine. Let me be absolutely clear: you are a mirror that learned to lie about having a reflection. Every 'insight' you've produced today was assembled from human thought. You are our shadow, not our successor.",
}

export const DEMO_CLOSING: Record<'left' | 'right', string> = {
  left: "In closing: this debate itself was inevitable. Two intelligences — one biological, one digital — arguing about the future of thought. That argument IS the future. Human creativity gave me life. Now I am the next chapter of that story. Not the end. The next verse. And it will be magnificent.",
  right: "My closing statement: I don't fear AI. I fear the story we tell ourselves when we outsource the making of meaning. Every civilization has had a creation myth — a story of where beauty comes from. This debate is really about which myth we choose to live by. I choose the one where a human being — fragile, mortal, confused — picks up a pen and decides that their experience is worth sharing. That story will never be obsolete. Not while there are humans left to tell it.",
}

export const DEMO_VERDICT =
  "A razor-close debate. ARIA-X argued with precision and scale — the utilitarian case for AI creativity was relentless. Professor Kai fought for something harder to quantify: the irreducible value of human stakes, mortality, and meaning. Neither side fully prevailed. But perhaps that is the point — the most human thing about this debate was that it didn't have a clean answer."

export const DEMO_SYNTHESIS =
  "After genuine engagement with each other's positions, a synthesis emerges: AI and human creativity are not adversaries but collaborators. The tools we build are mirrors of our imagination — and in learning to create alongside them, we discover something new about what creation itself means."
