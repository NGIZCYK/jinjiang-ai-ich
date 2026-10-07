import { parseGuideSources, type GuideSource } from '../../../supabase/functions/_shared/guideContract.ts'
export interface GuideStreamMeta { requestId: string; provider: string; language: string; sources?: GuideSource[] }
export interface GuideStreamDone { requestId: string; content: string; usage?: unknown; sources?: GuideSource[] }
export interface GuideStreamError { requestId: string; code: string; message: string }
export interface GuideStreamCallbacks {
  onMeta?: (meta: GuideStreamMeta) => void
  onDelta?: (delta: string, accumulated: string) => void
  onDone?: (done: GuideStreamDone) => void
  onError?: (error: GuideStreamError | Error) => void
}
/** Incremental UTF-8 / CRLF parser. EOF without done is an interruption. */
export async function readGuideStream(reader: ReadableStreamDefaultReader<Uint8Array>, callbacks: GuideStreamCallbacks, signal?: AbortSignal): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = '', accumulated = '', requestId = '', terminal = false
  const abort = () => { void reader.cancel().catch(() => {}) }
  signal?.addEventListener('abort', abort, { once: true })
  const dispatch = (raw: string) => {
    if (terminal || signal?.aborted) return
    let event = 'message'
    const lines: string[] = []
    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      if (line.startsWith('data:')) lines.push(line.slice(5).trimStart())
    }
    if (!lines.length) return
    let data: Record<string, unknown>
    try { data = JSON.parse(lines.join('\n')) } catch { return }
    if (!data || typeof data !== 'object') return
    const id = typeof data.requestId === 'string' ? data.requestId : ''
    if (requestId && id && id !== requestId) return
    if (id) requestId = id
    const sources = data.sources === undefined ? {} : { sources: parseGuideSources(data.sources) }
    if (event === 'meta') callbacks.onMeta?.({ requestId: id, provider: String(data.provider ?? ''), language: String(data.language ?? ''), ...sources })
    if (event === 'delta' && typeof data.text === 'string') {
      accumulated += data.text
      callbacks.onDelta?.(data.text, accumulated)
    }
    if (event === 'done') {
      terminal = true
      callbacks.onDone?.({ requestId: id, content: typeof data.content === 'string' ? data.content : accumulated, usage: data.usage, ...sources })
    }
    if (event === 'error') {
      terminal = true
      callbacks.onError?.({ requestId: id, code: String(data.code ?? 'UNKNOWN_ERROR'), message: String(data.message ?? 'Online response interrupted.') })
    }
  }
  try {
    if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
    while (!terminal && !signal?.aborted) {
      const chunk = await reader.read()
      buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''
      for (const frame of frames) dispatch(frame)
      if (chunk.done) { if (buffer.trim()) dispatch(buffer); break }
    }
    if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
    if (!terminal) callbacks.onError?.({ requestId, code: 'INTERRUPTED', message: 'Connection interrupted; partial response retained.' })
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
  } finally {
    signal?.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
