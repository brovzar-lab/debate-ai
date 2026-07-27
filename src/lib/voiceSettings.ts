export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

// Maps debate intensity (1-5) to ElevenLabs voice_settings.
// Lower stability + higher style = more emotional/expressive delivery.
export const VOICE_SETTINGS_BY_INTENSITY: Record<number, VoiceSettings> = {
  1: { stability: 0.85, similarity_boost: 0.80, style: 0.00, use_speaker_boost: true },
  2: { stability: 0.70, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  3: { stability: 0.55, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
  4: { stability: 0.35, similarity_boost: 0.70, style: 0.65, use_speaker_boost: true },
  5: { stability: 0.20, similarity_boost: 0.65, style: 0.90, use_speaker_boost: true },
}

export function getVoiceSettings(intensity: number): VoiceSettings {
  const clamped = Math.min(5, Math.max(1, Math.round(intensity)))
  return VOICE_SETTINGS_BY_INTENSITY[clamped] ?? VOICE_SETTINGS_BY_INTENSITY[3]
}
