export type AiAction = 'POLISH' | 'EXPAND' | 'CORRECT' | 'FORMAT'

export interface AiOptions {
  tone?: string
  targetLength?: string
  language?: string
  preserveMarkup?: boolean
}

export interface AiTransformReq {
  action: AiAction
  text: string
  options?: AiOptions
  context?: string
}

export interface AiStreamChunkResp {
  delta: string | null
  done: boolean
  isHtml: boolean | null
}

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '/api'
const AI_STREAM_PATH = '/note/ai/transform/stream'

export async function streamAiTransform(
  req: AiTransformReq,
  onDelta: (delta: string) => void,
  onDone: (isHtml: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = API_BASE + AI_STREAM_PATH
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(token ? { token } : {}),
    },
    body: JSON.stringify(req),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`AI接口请求失败: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const events = buffer.split('\n\n')
    // 保留最后不完整的块在缓冲区
    buffer = events.pop() || ''

    for (const raw of events) {
      const lines = raw.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const json = line.slice(5).trim()
        if (!json) continue
        try {
          const obj = JSON.parse(json) as AiStreamChunkResp
          if (obj.done) {
            onDone(Boolean(obj.isHtml))
          } else if (obj.delta) {
            onDelta(obj.delta)
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  }
}

