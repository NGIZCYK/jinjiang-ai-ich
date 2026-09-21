import { describe, expect, it } from 'vitest'
import { DEFAULT_NEEDS, progress, recommend } from '../src/lib/journey'
import { loadGuideSignals, persistGuideSignals } from '../src/lib/guideSignalStorage'
import type { GuideSignal } from '../src/types'

function stubStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, String(value)) },
    removeItem: (key: string) => { map.delete(key) },
  }
}

const validSignal: GuideSignal = {
  id: 's1', sourceMessageId: 'm1', language: 'zh', topics: ['craft'],
  stayHours: 2, budget: 100, partyType: 'family', sentiment: 'positive', createdAt: 1,
}

describe('session-only guide signal preview',()=>{
 it('round-trips signals through device storage',()=>{
  const storage = stubStorage()
  persistGuideSignals([validSignal], storage)
  expect(loadGuideSignals(storage)).toEqual([validSignal])
 })
 it('ignores corrupted JSON and malformed entries instead of crashing',()=>{
  const storage = stubStorage()
  storage.setItem('jj_v3_session_guide_signals','{not json')
  expect(loadGuideSignals(storage)).toEqual([])
  storage.setItem('jj_v3_session_guide_signals',JSON.stringify([validSignal,{id:2},'x',null]))
  expect(loadGuideSignals(storage)).toEqual([validSignal])
 })
 it('removes the stored key when the list is cleared',()=>{
  const storage = stubStorage()
  persistGuideSignals([validSignal], storage)
  persistGuideSignals([], storage)
  expect(storage.getItem('jj_v3_session_guide_signals')).toBeNull()
  expect(loadGuideSignals(storage)).toEqual([])
 })
 it('caps stored signals at 200 entries',()=>{
  const storage = stubStorage()
  const many = Array.from({length:250},(_,i)=>({...validSignal,id:`s${i}`,createdAt:i}))
  persistGuideSignals(many, storage)
  const loaded = loadGuideSignals(storage)
  expect(loaded).toHaveLength(200)
  expect(loaded[0].id).toBe('s0')
 })
})

describe('recommendation and exploration behaviour',()=>{
 it('changes the experience when 90 minutes become 20',()=>{expect(recommend({...DEFAULT_NEEDS,interest:'experience'})[0].id).toBe('workshop');expect(recommend({...DEFAULT_NEEDS,interest:'experience',minutes:20}).map(x=>x.id)).toEqual(['scroll'])})
 it('enforces per-person budget and party compatibility',()=>{expect(recommend({...DEFAULT_NEEDS,budget:0}).map(x=>x.id)).toEqual(['scroll']);expect(recommend({...DEFAULT_NEEDS,party:'business'}).some(x=>x.id==='workshop')).toBe(false)})
 it('has honest no-match output',()=>{expect(recommend({...DEFAULT_NEEDS,minutes:5})).toEqual([]);expect(recommend({...DEFAULT_NEEDS,budget:NaN})).toEqual([])})
 it('requires two DISTINCT valid comparison levels and an answered reflection',()=>{expect(progress({motif:'boats',palette:'jade',levels:['full','full'],answer:''})).toBe(1);expect(progress({motif:'boats',palette:'jade',levels:['full','1/4'],answer:'universal'})).toBe(3)})
 it('prioritises saved craft interest without exceeding time',()=>{expect(recommend({...DEFAULT_NEEDS,minutes:40,interest:'craft'})[0].id).toBe('materials')})
})
