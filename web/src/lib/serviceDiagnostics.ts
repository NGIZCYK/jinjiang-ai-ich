export function voiceErrorType(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'CANCELLED'
    if (error.name === 'NotAllowedError') return 'PLAYBACK_BLOCKED'
    if (error.name === 'TimeoutError') return 'TIMEOUT'
    if (['VOICE_TOKEN_UNAVAILABLE', 'VOICE_SYNTHESIS_FAILED', 'VOICE_AUDIO_UNAVAILABLE', 'VOICE_PLAYBACK_ERROR'].includes(error.message)) return error.message
  }
  return 'VOICE_SERVICE_ERROR'
}

/** Log only generated identifiers and timing; never log text, tokens or errors. */
export function logVoiceRequest(requestId: string, mode: string, startedAt: number, outcome: 'success' | 'cancelled' | 'error', errorType?: string): void {
  console.info(JSON.stringify({
    event: 'voice_request', requestId, mode, outcome,
    durationMs: Math.round(performance.now() - startedAt),
    ...(errorType ? { errorType } : {}),
  }))
}
