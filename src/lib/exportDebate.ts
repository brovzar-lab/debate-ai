import type { Turn, DebateConfig, DebatePhase } from '../types'
import { DEBATE_FORMATS, DEFAULT_FORMAT_ID, BRAINSTORM_SUBJECTS } from '../data/debateFormats'

export interface ExportParams {
  config: DebateConfig
  turns: Turn[]
  phase: DebatePhase
}

function subjectLabel(config: DebateConfig): string | null {
  if (config.format !== 'brainstorm' || !config.subject) return null
  const found = BRAINSTORM_SUBJECTS.find((s) => s.id === config.subject)
  return found ? `${found.emoji} ${found.label}` : config.subject
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

export function serializeDebateMarkdown(params: ExportParams): string {
  const { config, turns, phase } = params
  const fmt = DEBATE_FORMATS[config.format ?? DEFAULT_FORMAT_ID]
  const left = config.debaters[0]
  const right = config.debaters[1]
  const subject = subjectLabel(config)

  const doneTurns = turns.filter((t) => t.status === 'done')
  const leadTurns = doneTurns.filter((t) => t.role === 'lead')
  const debaterTurns = doneTurns.filter((t) => t.role !== 'lead')

  const lines: string[] = []

  lines.push(`# ${fmt.emoji} ${fmt.label}`)
  lines.push('')
  lines.push(`**Topic:** "${config.topic}"`)
  lines.push(`**Format:** ${fmt.label}`)
  if (subject) lines.push(`**Subject:** ${subject}`)
  lines.push(`**Date:** ${isoDate()}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Debaters')
  lines.push('')
  lines.push('| | Left | Right |')
  lines.push('|---|---|---|')
  lines.push(`| **Persona** | ${left.personaName} | ${right.personaName} |`)
  lines.push(`| **Model** | ${left.model.name} | ${right.model.name} |`)
  lines.push(`| **Stance** | ${left.stance} | ${right.stance} |`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Transcript')
  lines.push('')

  debaterTurns.forEach((turn, i) => {
    const name = turn.side === 'left' ? left.personaName : right.personaName
    lines.push(`### ${name} (Turn ${i + 1})`)
    lines.push('')
    lines.push(turn.text.trim())
    lines.push('')
  })

  if (leadTurns.length > 0) {
    lines.push('---')
    lines.push('')
    lines.push('## Best Idea')
    lines.push('')
    leadTurns.forEach((turn) => {
      lines.push(turn.text.trim())
      lines.push('')
    })
  } else if (phase === 'done') {
    lines.push('---')
    lines.push('')
    lines.push('*Debate concluded.*')
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Plain text ───────────────────────────────────────────────────────────────

export function serializeDebatePlain(params: ExportParams): string {
  const { config, turns, phase } = params
  const fmt = DEBATE_FORMATS[config.format ?? DEFAULT_FORMAT_ID]
  const left = config.debaters[0]
  const right = config.debaters[1]
  const subject = subjectLabel(config)

  const doneTurns = turns.filter((t) => t.status === 'done')
  const leadTurns = doneTurns.filter((t) => t.role === 'lead')
  const debaterTurns = doneTurns.filter((t) => t.role !== 'lead')

  const sep = '─'.repeat(60)
  const lines: string[] = []

  lines.push(`${fmt.emoji} ${fmt.label.toUpperCase()}`)
  lines.push(sep)
  lines.push(`Topic:   "${config.topic}"`)
  lines.push(`Format:  ${fmt.label}`)
  if (subject) lines.push(`Subject: ${subject}`)
  lines.push(`Date:    ${isoDate()}`)
  lines.push('')
  lines.push(`Left:    ${left.personaName} — ${left.model.name} (${left.stance})`)
  lines.push(`Right:   ${right.personaName} — ${right.model.name} (${right.stance})`)
  lines.push(sep)
  lines.push('')

  debaterTurns.forEach((turn, i) => {
    const name = turn.side === 'left' ? left.personaName : right.personaName
    lines.push(`[Turn ${i + 1}] ${name.toUpperCase()}`)
    lines.push(turn.text.trim())
    lines.push('')
  })

  if (leadTurns.length > 0) {
    lines.push(sep)
    lines.push('BEST IDEA')
    lines.push(sep)
    leadTurns.forEach((turn) => {
      lines.push(turn.text.trim())
      lines.push('')
    })
  } else if (phase === 'done') {
    lines.push(sep)
    lines.push('Debate concluded.')
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Browser helpers ──────────────────────────────────────────────────────────

export function downloadDebate(content: string, filename: string): void {
  const mimeType = filename.endsWith('.md') ? 'text/markdown' : 'text/plain'
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function makeFilename(config: DebateConfig, ext: 'md' | 'txt'): string {
  const slug = config.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `debate-${slug}.${ext}`
}
