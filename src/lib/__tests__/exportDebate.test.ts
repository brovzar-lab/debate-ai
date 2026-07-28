import { describe, it, expect } from 'vitest'
import { serializeDebateMarkdown, serializeDebatePlain, makeFilename } from '../exportDebate'
import type { ExportParams } from '../exportDebate'
import { MODELS } from '../../data/models'

const baseParams: ExportParams = {
  config: {
    topic: 'Is remote work better than office work?',
    format: 'classic',
    debaters: [
      { side: 'left', model: MODELS[0], personaName: 'The Firebrand', stance: 'Remote is better' },
      { side: 'right', model: MODELS[1], personaName: 'The Professor', stance: 'Office is better' },
    ],
    intensity: 3,
    turnCap: 4,
  },
  turns: [
    { id: 't1', side: 'left', text: 'Remote work gives you freedom.', status: 'done', turnNumber: 0 },
    { id: 't2', side: 'right', text: 'Office fosters collaboration.', status: 'done', turnNumber: 1 },
    { id: 't3', side: 'left', text: 'Streaming turn not included', status: 'streaming', turnNumber: 2 },
  ],
  phase: 'done',
}

describe('serializeDebateMarkdown', () => {
  it('includes topic, format, and debater table in header', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).toContain('"Is remote work better than office work?"')
    expect(md).toContain('Classic Debate')
    expect(md).toContain('The Firebrand')
    expect(md).toContain('The Professor')
  })

  it('includes model names in debater table', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).toContain(MODELS[0].name)
    expect(md).toContain(MODELS[1].name)
  })

  it('omits streaming turns from transcript', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).toContain('Remote work gives you freedom.')
    expect(md).toContain('Office fosters collaboration.')
    expect(md).not.toContain('Streaming turn not included')
  })

  it('labels turns with persona name and 1-based index', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).toContain('The Firebrand (Turn 1)')
    expect(md).toContain('The Professor (Turn 2)')
  })

  it('adds "Debate concluded" footer for done phase without lead turns', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).toContain('Debate concluded')
  })

  it('does not add concluded footer when not done', () => {
    const md = serializeDebateMarkdown({ ...baseParams, phase: 'debating' })
    expect(md).not.toContain('Debate concluded')
  })

  it('includes Subject line for brainstorm format', () => {
    const params: ExportParams = {
      ...baseParams,
      config: { ...baseParams.config, format: 'brainstorm', subject: 'film' },
    }
    const md = serializeDebateMarkdown(params)
    expect(md).toContain('**Subject:**')
    expect(md).toContain('Film')
  })

  it('omits Subject line for non-brainstorm formats', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).not.toContain('**Subject:**')
  })

  it('includes Template row when debater has a persona template', () => {
    const params: ExportParams = {
      ...baseParams,
      config: {
        ...baseParams.config,
        debaters: [
          { ...baseParams.config.debaters[0], personaName: 'SPARK', persona: { name: 'The Screenwriter' } },
          baseParams.config.debaters[1],
        ],
      },
    }
    const md = serializeDebateMarkdown(params)
    expect(md).toContain('**Template**')
    expect(md).toContain('The Screenwriter')
  })

  it('omits Template row when no debater has a persona template', () => {
    const md = serializeDebateMarkdown(baseParams)
    expect(md).not.toContain('**Template**')
  })

  it('renders lead synthesis as a ## Best Idea section', () => {
    const params: ExportParams = {
      ...baseParams,
      config: { ...baseParams.config, format: 'brainstorm', subject: 'startup' },
      turns: [
        ...baseParams.turns.filter((t) => t.status === 'done'),
        {
          id: 'lead1',
          side: 'left',
          text: '🏆 BEST IDEA: A time-travel startup',
          status: 'done',
          turnNumber: 3,
          role: 'lead',
        },
      ],
    }
    const md = serializeDebateMarkdown(params)
    expect(md).toContain('## Best Idea')
    expect(md).toContain('🏆 BEST IDEA: A time-travel startup')
  })

  it('does not render lead turns inside the Transcript section', () => {
    const params: ExportParams = {
      ...baseParams,
      config: { ...baseParams.config, format: 'brainstorm', subject: 'startup' },
      turns: [
        ...baseParams.turns.filter((t) => t.status === 'done'),
        { id: 'lead1', side: 'left', text: 'Lead result text', status: 'done', turnNumber: 3, role: 'lead' },
      ],
    }
    const md = serializeDebateMarkdown(params)
    const transcriptSection = md.split('## Transcript')[1].split('---')[0]
    expect(transcriptSection).not.toContain('Lead result text')
  })

  it('omits "Debate concluded" when lead turns are present', () => {
    const params: ExportParams = {
      ...baseParams,
      config: { ...baseParams.config, format: 'brainstorm', subject: 'startup' },
      turns: [
        ...baseParams.turns.filter((t) => t.status === 'done'),
        { id: 'lead1', side: 'left', text: 'Best idea', status: 'done', turnNumber: 3, role: 'lead' },
      ],
    }
    const md = serializeDebateMarkdown(params)
    expect(md).not.toContain('Debate concluded')
  })
})

describe('serializeDebatePlain', () => {
  it('includes topic and debater info', () => {
    const txt = serializeDebatePlain(baseParams)
    expect(txt).toContain('Is remote work better than office work?')
    expect(txt).toContain('The Firebrand')
    expect(txt).toContain('The Professor')
  })

  it('includes only done turns, uppercased by persona', () => {
    const txt = serializeDebatePlain(baseParams)
    expect(txt).toContain('THE FIREBRAND')
    expect(txt).toContain('THE PROFESSOR')
    expect(txt).toContain('Remote work gives you freedom.')
    expect(txt).not.toContain('Streaming turn not included')
  })

  it('renders lead synthesis as BEST IDEA section', () => {
    const params: ExportParams = {
      ...baseParams,
      config: { ...baseParams.config, format: 'brainstorm', subject: 'film' },
      turns: [
        ...baseParams.turns.filter((t) => t.status === 'done'),
        { id: 'lead1', side: 'left', text: 'The best idea is here', status: 'done', turnNumber: 3, role: 'lead' },
      ],
    }
    const txt = serializeDebatePlain(params)
    expect(txt).toContain('BEST IDEA')
    expect(txt).toContain('The best idea is here')
  })

  it('adds "Debate concluded." footer for done phase', () => {
    const txt = serializeDebatePlain(baseParams)
    expect(txt).toContain('Debate concluded.')
  })

  it('appends template name in brackets when debater has a persona template', () => {
    const params: ExportParams = {
      ...baseParams,
      config: {
        ...baseParams.config,
        debaters: [
          { ...baseParams.config.debaters[0], personaName: 'SPARK', persona: { name: 'The Screenwriter' } },
          baseParams.config.debaters[1],
        ],
      },
    }
    const txt = serializeDebatePlain(params)
    expect(txt).toContain('SPARK [The Screenwriter]')
  })

  it('omits template brackets when debater has no persona template', () => {
    const txt = serializeDebatePlain(baseParams)
    expect(txt).not.toContain('The Firebrand [')
    expect(txt).not.toContain('The Professor [')
  })
})

describe('makeFilename', () => {
  it('slugifies topic and appends extension', () => {
    expect(makeFilename(baseParams.config, 'md')).toMatch(/^debate-is-remote-work.*\.md$/)
    expect(makeFilename(baseParams.config, 'txt')).toMatch(/^debate-is-remote-work.*\.txt$/)
  })

  it('truncates long topics', () => {
    const config = { ...baseParams.config, topic: 'a'.repeat(100) }
    const fn = makeFilename(config, 'md')
    // "debate-" (7) + slug max 40 + ".md" (3) = 50
    expect(fn.length).toBeLessThanOrEqual(50)
  })

  it('strips special characters from topic', () => {
    const config = { ...baseParams.config, topic: 'AI vs. Humans! Who wins?' }
    const fn = makeFilename(config, 'txt')
    // Topic-derived slug must not contain punctuation; the .txt extension dot is expected
    const slug = fn.replace(/^debate-/, '').replace(/\.txt$/, '')
    expect(slug).not.toMatch(/[!?./]/)
    expect(fn).toMatch(/^debate-ai-vs/)
  })
})
