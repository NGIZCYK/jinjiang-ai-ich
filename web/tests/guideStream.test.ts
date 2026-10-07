import { describe, expect, it, vi } from 'vitest'
import { readGuideStream } from '../src/lib/guideStream'
const event = (name: string, data: unknown) => `event: ${name}\r\ndata: ${JSON.stringify(data)}\r\n\r\n`
function reader(text: string, size = 1) {
  const bytes = new TextEncoder().encode(text)
  return new ReadableStream<Uint8Array>({start(c){for(let i=0;i<bytes.length;i+=size)c.enqueue(bytes.slice(i,i+size));c.close()}}).getReader()
}
describe('guide SSE', () => {
  it('decodes UTF-8 split across bytes and retains actual server sources', async () => {
    const source={id:'silk',title:'丝线',category:'practice',references:['project card']}
    const onDone=vi.fn(), onDelta=vi.fn(), onMeta=vi.fn(), onError=vi.fn()
    await readGuideStream(reader(event('meta',{requestId:'r',provider:'deepseek',sources:[source]})+event('delta',{requestId:'r',text:'丝光🌿'})+event('done',{requestId:'r',content:'丝光🌿',sources:[source]})),{onDone,onDelta,onMeta,onError})
    expect(onDelta).toHaveBeenCalledWith('丝光🌿','丝光🌿')
    expect(onDone.mock.calls[0][0].sources).toEqual([source])
    expect(onError).not.toHaveBeenCalled()
  })
  it('supports source-less legacy done and final frame without a blank separator', async () => {
    const onDone=vi.fn()
    await readGuideStream(reader('event: done\ndata: {"content":"legacy"}'),{onDone})
    expect(onDone.mock.calls[0][0].content).toBe('legacy')
    expect(onDone.mock.calls[0][0].sources).toBeUndefined()
  })
  it('retains final delta while reporting EOF interruption', async () => {
    const onDone=vi.fn(),onDelta=vi.fn(),onError=vi.fn()
    await readGuideStream(reader('event: delta\ndata: {"text":"partial"}'),{onDone,onDelta,onError})
    expect(onDelta).toHaveBeenCalledWith('partial','partial')
    expect(onDone).not.toHaveBeenCalled()
    expect(onError.mock.calls[0][0].code).toBe('INTERRUPTED')
  })
  it('ignores malformed JSON and foreign requests, and stops after completion', async () => {
    const onDelta=vi.fn(),onDone=vi.fn()
    await readGuideStream(reader('event: delta\ndata: broken\n\n'+event('meta',{requestId:'r'})+event('delta',{requestId:'other',text:'wrong'})+event('done',{requestId:'r',content:'ok'})+event('delta',{requestId:'r',text:'late'})),{onDelta,onDone})
    expect(onDelta).not.toHaveBeenCalled();expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('preserves server error and does not call done', async () => {
    const onDone=vi.fn(),onError=vi.fn()
    await readGuideStream(reader(event('error',{code:'UPSTREAM_ERROR',message:'interrupted'})),{onDone,onError})
    expect(onError.mock.calls[0][0].code).toBe('UPSTREAM_ERROR');expect(onDone).not.toHaveBeenCalled()
  })
  it('cancels a blocked read and releases its lock', async () => {
    const cancel=vi.fn(),abort=new AbortController(),onError=vi.fn()
    const stream=new ReadableStream<Uint8Array>({cancel}),pending=readGuideStream(stream.getReader(),{onError},abort.signal)
    abort.abort()
    await expect(pending).rejects.toMatchObject({name:'AbortError'})
    expect(cancel).toHaveBeenCalled();expect(stream.locked).toBe(false);expect(onError).not.toHaveBeenCalled()
  })
  it('reports transport errors without completing', async () => {
    const onError=vi.fn(),onDone=vi.fn()
    const stream=new ReadableStream<Uint8Array>({start(c){c.error(new Error('network'))}})
    await readGuideStream(stream.getReader(),{onDone,onError})
    expect(onError.mock.calls[0][0].message).toBe('network');expect(onDone).not.toHaveBeenCalled()
  })
})
