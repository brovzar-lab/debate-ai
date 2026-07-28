import { useState, useCallback } from 'react'
import { useDebateStore } from '../../store/debateStore'
import {
  serializeDebateMarkdown,
  serializeDebatePlain,
  downloadDebate,
  makeFilename,
} from '../../lib/exportDebate'

interface ExportControlsProps {
  onToast: (message: string) => void
}

export function ExportControls({ onToast }: ExportControlsProps) {
  const { config, turns, phase } = useDebateStore()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!config) return
    const text = serializeDebateMarkdown({ config, turns, phase })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onToast('Clipboard unavailable — try downloading instead')
    }
  }, [config, turns, phase, onToast])

  const handleDownload = useCallback(
    (ext: 'md' | 'txt') => {
      if (!config) return
      const content =
        ext === 'md'
          ? serializeDebateMarkdown({ config, turns, phase })
          : serializeDebatePlain({ config, turns, phase })
      downloadDebate(content, makeFilename(config, ext))
    },
    [config, turns, phase]
  )

  if (!config) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mr-1">
        Export
      </span>

      <button
        onClick={handleCopy}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          copied
            ? 'bg-green-700/60 text-green-200 border border-green-600/40'
            : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
        }`}
        title="Copy full debate to clipboard (Markdown)"
      >
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>

      <button
        onClick={() => handleDownload('md')}
        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
        title="Download as Markdown (.md)"
      >
        ⬇ .md
      </button>

      <button
        onClick={() => handleDownload('txt')}
        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
        title="Download as plain text (.txt)"
      >
        ⬇ .txt
      </button>
    </div>
  )
}
