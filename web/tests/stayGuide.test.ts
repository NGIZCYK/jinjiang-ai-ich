import { describe,it,expect,vi } from 'vitest'
const api=vi.hoisted(()=>({fetch:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({apiFetch:api.fetch}))
vi.mock('../src/lib/stayConfig',()=>({STAYS_ENABLED:true,STAY_VERSION:'test'}))
import { askWanNiang,askWanNiangStream,extractGuideSignal } from '../src/lib/llm'
import { isStayQuestion } from '../src/data/stayGuide'
describe('Stay-specific guide boundaries',()=>{
 it('explains booking rules with a room-search action and no fabricated availability',async()=>{
  const result=await askWanNiang('我想订一间套房，房价多少？',[],'zh')
  expect(result.action).toEqual({type:'view_stays'});expect(result.answerSource).toBe('local');expect(result.content).toContain('以查询页为准');expect(result.content).toContain('不能替你锁房');expect(api.fetch).not.toHaveBeenCalled()
 })
 it('keeps accommodation budgets out of activity-recommendation signals',()=>{
  expect(extractGuideSignal('订房预算2000元，想预订苏绣套房','zh')).toBeNull()
  expect(isStayQuestion('苏绣劈丝和针法有什么区别')).toBe(false)
 })
 it('supports English and stream completion without pretending to call a model',async()=>{
  const onDone=vi.fn();const result=await askWanNiangStream('How do I book a room?',[],'en',{onDone})
  expect(result.content).toContain('No actual payment');expect(onDone).toHaveBeenCalledWith(result);expect(result.sources[0].category).toBe('prototype')
 })
 it('honours cancellation even for locally answered accommodation questions',async()=>{
  const controller=new AbortController();controller.abort();await expect(askWanNiangStream('套房预订',[],'zh',{},controller.signal)).rejects.toThrow(/cancelled/)
 })
})
