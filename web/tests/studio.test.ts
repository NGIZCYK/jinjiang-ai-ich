import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUDIENCES, CHANNELS, COPY_LIMITS, parseStudioInputs, parseStudioDraft, templateStudioDraft, studioMarkdown, itineraryDuration, encodeStudioContent, decodeStudioContent, type StudioInputs } from '../../supabase/functions/_shared/studio'
const cloud = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('../src/lib/cloud', () => cloud)
import { generateStudioDraft } from '../src/lib/studio'
const input: StudioInputs = {task:'itinerary',audience:'culture',channel:'signage',minutes:90,theme:'长卷与丝线',language:'zh'}

describe('structured content and editable persistence', () => {
  it.each([60,90,120,180])('validates every audience and language at %i minutes', minutes => {
    for(const audience of Object.keys(AUDIENCES) as StudioInputs['audience'][]) for(const language of ['zh','en'] as const){
      const brief={...input,minutes,audience,language}
      const draft=templateStudioDraft(brief)
      expect(parseStudioDraft(draft,brief,'template')).not.toBeNull()
      expect(itineraryDuration(studioMarkdown(draft),brief)).toEqual({valid:true,total:minutes,count:4})
    }
  })
  it('rejects unsupported inputs, forged references and wrong duration', () => {
    for(const patch of [{minutes:0},{minutes:91},{audience:'__proto__'},{channel:'admin'},{theme:''},{theme:'x'.repeat(181)},{language:'fr'}])expect(parseStudioInputs({...input,...patch})).toBeNull()
    const draft=templateStudioDraft(input)
    expect(parseStudioDraft({...draft,referenceIds:['invented']},input)).toBeNull()
    expect(parseStudioDraft({...draft,segments:draft.segments.map(s=>({...s,minutes:1}))},input)).toBeNull()
    expect(itineraryDuration(studioMarkdown(draft).replace('27 分钟','28 分钟'),input).valid).toBe(false)
    expect(itineraryDuration('Edited text without timed sections',input).valid).toBe(false)
  })
  it('adapts audience emphasis, channel length and next action', () => {
    const culture=templateStudioDraft(input), family=templateStudioDraft({...input,audience:'family'})
    expect(culture.segments[0].minutes).not.toBe(family.segments[0].minutes)
    expect(culture.segments[1].description).not.toBe(family.segments[1].description)
    for(const channel of Object.keys(CHANNELS) as StudioInputs['channel'][]) for(const language of ['zh','en'] as const){
      const brief={...input,task:'copy' as const,channel,language,theme:'x'.repeat(180)}
      const draft=templateStudioDraft(brief)
      expect(draft.copyText.length).toBeLessThanOrEqual(COPY_LIMITS[channel])
      expect(parseStudioDraft(draft,brief,'template')).not.toBeNull()
    }
    expect(templateStudioDraft({...input,task:'copy',minutes:120}).copyText).toContain('120')
    expect(templateStudioDraft({...input,task:'copy',channel:'letter'}).copyText).not.toBe(templateStudioDraft({...input,task:'copy',channel:'signage'}).copyText)
  })
  it('keeps original text and actual language across storage, supports legacy content', () => {
    const body=studioMarkdown(templateStudioDraft(input))+'\n\nEditorial changes'
    const decoded=decodeStudioContent(encodeStudioContent(body,input,'template'))
    expect(decoded).toEqual({body,inputs:input,provider:'template'})
    expect(decodeStudioContent('Legacy draft')).toEqual({body:'Legacy draft',inputs:null,provider:null})
    expect(decodeStudioContent('Legacy\n<!--jj-studio:invalid-->').body).toBe('Legacy')
  })
})
describe('online generation and honest fallback', () => {
  beforeEach(()=>{cloud.apiFetch.mockReset()})
  it('uses the protected route with all inputs and labels only validated output as online', async () => {
    cloud.apiFetch.mockResolvedValue(Response.json({draft:templateStudioDraft(input)}))
    expect((await generateStudioDraft(input)).provider).toBe('deepseek')
    expect(cloud.apiFetch).toHaveBeenCalledWith('/api/studio/generate',expect.objectContaining({body:JSON.stringify({input})}))
  })
  it.each(['offline','invalid-json','invalid-duration','http-error'])('retains an editable template on %s',async kind=>{
    if(kind==='offline')cloud.apiFetch.mockImplementation(async()=>{throw new Error('network')})
    else if(kind==='invalid-json')cloud.apiFetch.mockResolvedValue(new Response('broken'))
    else if(kind==='http-error')cloud.apiFetch.mockResolvedValue(new Response('{}',{status:503}))
    else cloud.apiFetch.mockResolvedValue(Response.json({draft:{...templateStudioDraft(input),segments:[]}}))
    const draft=await generateStudioDraft(input)
    expect(draft.provider).toBe('template');expect(draft.inputs).toEqual(input)
    expect(itineraryDuration(studioMarkdown(draft),input).valid).toBe(true)
  })
  it('does not replace a cancelled request with a template',async()=>{
    const controller=new AbortController();controller.abort()
    cloud.apiFetch.mockImplementation(async()=>{throw new Error('aborted')})
    await expect(generateStudioDraft(input,controller.signal)).rejects.toThrow('aborted')
  })
})
