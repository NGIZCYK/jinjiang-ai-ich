/**
 * 导览 SSE 流式事件解析器
 * 依据《婉娘Live2D数字人实施任务书》5.2节标准协议：
 * - event: meta   data: {"requestId":"...","provider":"deepseek","language":"zh"}
 * - event: delta  data: {"requestId":"...","text":"..."}
 * - event: done   data: {"requestId":"...","content":"...","usage":null}
 * - event: error  data: {"requestId":"...","code":"...","message":"..."}
 */

export interface GuideStreamMeta {
  requestId: string
  provider: string
  language: string
}

export interface GuideStreamDelta {
  requestId: string
  text: string
}

export interface GuideStreamDone {
  requestId: string
  content: string
  usage?: unknown
}

export interface GuideStreamError {
  requestId: string
  code: string
  message: string
}

export interface GuideStreamCallbacks {
  onMeta?: (meta: GuideStreamMeta) => void
  onDelta?: (delta: string, accumulated: string) => void
  onDone?: (done: GuideStreamDone) => void
  onError?: (error: GuideStreamError | Error) => void
}

/**
 * 读取并解析 SSE 响应流
 */
export async function readGuideStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: GuideStreamCallbacks,
): Promise<void> {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let accumulated = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE 事件以双换行分割
      const parts = buffer.split(/\r?\n\r?\n/)
      // 最后一个部分可能尚未完整接收，放回 buffer
      buffer = parts.pop() ?? ''

      for (const rawEvent of parts) {
        const trimmed = rawEvent.trim()
        if (!trimmed) continue

        let eventType = 'message'
        const dataLines: string[] = []

        const lines = trimmed.split(/\r?\n/)
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim())
          }
        }

        const dataStr = dataLines.join('\n')
        if (!dataStr) continue

        try {
          const parsed = JSON.parse(dataStr) as Record<string, unknown>

          if (eventType === 'meta') {
            callbacks.onMeta?.({
              requestId: String(parsed.requestId || ''),
              provider: String(parsed.provider || ''),
              language: String(parsed.language || ''),
            })
          } else if (eventType === 'delta') {
            const text = String(parsed.text || '')
            accumulated += text
            callbacks.onDelta?.(text, accumulated)
          } else if (eventType === 'done') {
            const finalContent = typeof parsed.content === 'string' ? parsed.content : accumulated
            callbacks.onDone?.({
              requestId: String(parsed.requestId || ''),
              content: finalContent,
              usage: parsed.usage,
            })
          } else if (eventType === 'error') {
            callbacks.onError?.({
              requestId: String(parsed.requestId || ''),
              code: String(parsed.code || 'UNKNOWN_ERROR'),
              message: String(parsed.message || '导览服务发生错误'),
            })
          }
        } catch {
          // 非 JSON 数据或格式异常跳过
        }
      }
    }

    // 冲刷剩余 buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      let eventType = 'message'
      const dataLines: string[] = []
      for (const line of trimmed.split(/\r?\n/)) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim())
        }
      }
      const dataStr = dataLines.join('\n')
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr) as Record<string, unknown>
          if (eventType === 'done') {
            callbacks.onDone?.({
              requestId: String(parsed.requestId || ''),
              content: typeof parsed.content === 'string' ? parsed.content : accumulated,
              usage: parsed.usage,
            })
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 客户端正常终止
      return
    }
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}
