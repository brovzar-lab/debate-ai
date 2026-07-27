import { useState, useEffect } from 'react'
import { Model, DebateConfig, Debater } from '../../types'
import { MODELS } from '../../data/models'
import { ModelCard } from './ModelCard'
import { DebaterPodium } from './DebaterPodium'
import { isDemoMode, getOpenRouterKey, setOpenRouterKey, clearOpenRouterKey } from '../../lib/demo'
import { DEFAULT_VOICE_IDS } from '../../lib/tts'
import { useAvailableModels } from '../../hooks/useAvailableModels'
import {
  DEMO_TOPIC,
  DEMO_DEBATERS,
} from '../../data/demoScript'

interface SetupScreenProps {
  onStart: (config: DebateConfig) => void
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const demo = isDemoMode()
  const { models: availableModels, loading: modelsLoading, unavailableCount } = useAvailableModels()

  const [topic, setTopic] = useState(demo ? DEMO_TOPIC : '')
  const [leftModel, setLeftModel] = useState<Model | null>(
    demo ? (MODELS.find((m) => m.id === 'gpt-4o') ?? null) : null
  )
  const [rightModel, setRightModel] = useState<Model | null>(
    demo ? (MODELS.find((m) => m.id === 'claude-3-5-sonnet') ?? null) : null
  )

  // After live-mode validation completes, clear any selected model that is no
  // longer in the validated palette. Clearing sets it to null; the next run
  // short-circuits on the `null &&` guard, so this never loops.
  useEffect(() => {
    if (modelsLoading) return
    const availableIds = new Set(availableModels.map((m) => m.id))
    if (leftModel && !availableIds.has(leftModel.id)) setLeftModel(null)
    if (rightModel && !availableIds.has(rightModel.id)) setRightModel(null)
  }, [modelsLoading, availableModels, leftModel, rightModel])
  const [leftPersona, setLeftPersona] = useState(demo ? DEMO_DEBATERS.left.personaName : '')
  const [rightPersona, setRightPersona] = useState(demo ? DEMO_DEBATERS.right.personaName : '')
  const [leftStance, setLeftStance] = useState(demo ? DEMO_DEBATERS.left.stance : '')
  const [rightStance, setRightStance] = useState(demo ? DEMO_DEBATERS.right.stance : '')
  const [leftVoiceId, setLeftVoiceId] = useState<string>(DEFAULT_VOICE_IDS.left)
  const [rightVoiceId, setRightVoiceId] = useState<string>(DEFAULT_VOICE_IDS.right)
  const [turnCap, setTurnCap] = useState(5)
  const [apiKey, setApiKey] = useState(getOpenRouterKey() ?? '')
  const [showSettings, setShowSettings] = useState(false)

  const assignedModelIds = new Set([leftModel?.id, rightModel?.id].filter(Boolean))

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setOpenRouterKey(apiKey.trim())
      window.location.reload()
    } else {
      clearOpenRouterKey()
      window.location.reload()
    }
  }

  const canStart = topic.trim() && leftModel && rightModel && !modelsLoading

  const handleStart = () => {
    if (!canStart) return

    const leftDebater: Debater = {
      side: 'left',
      model: leftModel!,
      personaName: leftPersona || leftModel!.name,
      stance: leftStance || 'Pro side',
      voiceId: leftVoiceId,
    }
    const rightDebater: Debater = {
      side: 'right',
      model: rightModel!,
      personaName: rightPersona || rightModel!.name,
      stance: rightStance || 'Con side',
      voiceId: rightVoiceId,
    }

    onStart({
      topic: topic.trim(),
      debaters: [leftDebater, rightDebater],
      intensity: 2,
      turnCap,
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-red-500">DEBATE</span>
            <span className="text-white"> AI</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Pit two models against each other. You direct.</p>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-300 mb-2">OpenRouter API Key</p>
          <div className="flex gap-2 max-w-lg">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              onClick={handleSaveKey}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600 transition-colors"
            >
              Save & Reload
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Without a key, demo mode activates with a scripted debate.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col gap-8">
        {/* Topic */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Debate Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder="Enter a topic, idea, claim, or question to debate…"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
          />
        </div>

        {/* Podiums */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DebaterPodium
            side="left"
            model={leftModel}
            personaName={leftPersona}
            stance={leftStance}
            voiceId={leftVoiceId}
            onModelDrop={setLeftModel}
            onPersonaChange={setLeftPersona}
            onStanceChange={setLeftStance}
            onVoiceChange={setLeftVoiceId}
          />
          <DebaterPodium
            side="right"
            model={rightModel}
            personaName={rightPersona}
            stance={rightStance}
            voiceId={rightVoiceId}
            onModelDrop={setRightModel}
            onPersonaChange={setRightPersona}
            onStanceChange={setRightStance}
            onVoiceChange={setRightVoiceId}
          />
        </div>

        {/* Model palette */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Model Palette — drag onto a podium
            {!demo && unavailableCount > 0 && (
              <span className="ml-2 normal-case font-normal text-amber-500/70">
                ({unavailableCount} unavailable on OpenRouter, hidden)
              </span>
            )}
          </p>
          {modelsLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-32 rounded-xl bg-zinc-800 animate-pulse"
                />
              ))}
              <p className="w-full text-xs text-zinc-600 mt-1">Checking model availability…</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isAssigned={assignedModelIds.has(model.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Turn cap + CTA */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Rounds
            </label>
            <div className="flex gap-1">
              {[3, 5, 7, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setTurnCap(n)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                    turnCap === n
                      ? 'bg-zinc-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="rounded-xl bg-red-600 px-8 py-3 text-base font-black tracking-wide text-white transition-all hover:bg-red-500 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-red-900/40"
          >
            {demo ? '🎬 Start Demo Debate' : '⚔️ Start Debate'}
          </button>
        </div>

        {demo && (
          <p className="text-center text-xs text-amber-500/70">
            Demo mode — add your OpenRouter key in Settings to debate with real models
          </p>
        )}
      </div>
    </div>
  )
}
