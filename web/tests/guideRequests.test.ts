import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../src/lib/cloud'
import { askWanNiang, askWanNiangStream, getGuideCapabilities } from '../src/lib/llm'
import { searchICH } from '../src/data/ichItems'
import { requestOperatingBrief } from '../src/lib/analytics'
vi.mock('../src/lib/cloud',()=>({apiFetch:vi.fn()}))
const fetchMock=vi.mocked(apiFetch)
afterEach(()=>{fetchMock.mockReset();vi.unstubAllGlobals()})
describe('guide requests and local references',()=>{
  it('does not turn an AI scale suggestion into evidence approval',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({provider:'deepseek',brief:{decision:'scale',headline:'suggestion',rationale:'Synthetic forecast only',actions:[],scaleGate:'Verified trial',pauseGate:'Access issues',limitation:'Expansion requires verified participation and manual review.'}})))
    const result=await requestOperatingBrief('en',{batch:'demo'})
    expect(result.brief.decision).toBe('pilot')
    expect(result.brief.limitation).toContain('manual review')
  })
  it('disables online status for a failed capability request or SPA HTML',async()=>{
    fetchMock.mockResolvedValueOnce(new Response('',{status:403})).mockResolvedValueOnce(new Response('<html/>',{headers:{'Content-Type':'text/html'}}))
    expect((await getGuideCapabilities()).available).toBe(false)
    expect((await getGuideCapabilities()).available).toBe(false)
  })
  it('displays server sources and omits browser grounding fields',async()=>{
    const sources=[{id:'server-only',title:'Server reference',category:'practice',references:['review pending']}]
    fetchMock.mockResolvedValue(new Response(JSON.stringify({provider:'deepseek',content:'online',sources})))
    const result=await askWanNiang('劈丝是什么？')
    expect(result.sources).toEqual(sources)
    const payload=JSON.parse(fetchMock.mock.calls[0][1]!.body as string)
    expect(payload.context).toBeUndefined();expect(payload.intent).toBeUndefined()
  })
  it('accepts legacy JSON without presenting local cards as model grounding',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({provider:'deepseek',content:'legacy'}),{headers:{'Content-Type':'application/json'}}))
    const result=await askWanNiangStream('劈丝是什么？')
    expect(result.mode).toBe('deepseek');expect(result.sources).toEqual([])
  })
  it('uses source metadata in streamed responses',async()=>{
    vi.stubGlobal('window',{setTimeout,clearTimeout})
    const sources=[{id:'server',title:'Server card',category:'practice',references:[]}]
    fetchMock.mockResolvedValue(new Response(`event: meta\ndata: ${JSON.stringify({requestId:'r',provider:'deepseek',sources})}\n\nevent: delta\ndata: {"requestId":"r","text":"hello"}\n\nevent: done\ndata: {"requestId":"r","content":"hello"}\n\n`,{headers:{'Content-Type':'text/event-stream'}}))
    expect((await askWanNiangStream('劈丝是什么？')).sources).toEqual(sources)
  })
  it('associates distinct input topics with distinct cards in both languages',()=>{
    const silk=searchICH('劈丝', 'zh',4),scroll=searchICH('姑苏繁华图','zh',4)
    expect(silk[0].id).toBe('suxiu-pisi');expect(scroll[0].id).toBe('gusu-scroll-provenance')
    expect(searchICH('silk splitting','en',4)[0].id).toBe('suxiu-pisi')
  })
})
