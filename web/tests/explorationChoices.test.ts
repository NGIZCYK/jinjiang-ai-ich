import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_EXPLORATION, LEVELS, progress, toggleExplorationChoice, type Exploration } from '../src/lib/journey'
import { clearDraft, hasDraft, readDraft, writeDraft } from '../src/lib/journeyStore'

vi.mock('../src/lib/cloud', () => ({ cloud: null }))
vi.mock('../src/lib/store', () => ({ useAppStore: { getState: () => ({ user: null }) } }))

const complete: Exploration = { motif: 'boats', palette: 'jade', levels: ['full', '1/4'], answer: 'relative' }

describe('exploration card selection changes', () => {
  it.each(LEVELS)('lets %s be selected, deselected and selected again', level => {
    const initial = { ...EMPTY_EXPLORATION, levels: [] }
    const selected = toggleExplorationChoice(initial, 'levels', level)
    expect(selected.levels).toEqual([level])
    const cleared = toggleExplorationChoice(selected, 'levels', level)
    expect(cleared.levels).toEqual([])
    expect(toggleExplorationChoice(cleared, 'levels', level).levels).toEqual([level])
    expect(initial.levels).toEqual([])
  })

  it('removes only the clicked level, including duplicate legacy entries', () => {
    const initial = { ...complete, levels: ['full', '1/4', '1/4', '1/32'] }
    expect(toggleExplorationChoice(initial, 'levels', '1/4')).toEqual({ ...complete, levels: ['full', '1/32'] })
    expect(initial.levels).toEqual(['full', '1/4', '1/4', '1/32'])
  })

  it.each(['motif', 'palette'] as const)('can clear or replace the %s without clearing other answers', field => {
    expect(toggleExplorationChoice(complete, field, complete[field])).toEqual({ ...complete, [field]: '' })
    const replacement = field === 'motif' ? 'gate' : 'gold'
    expect(toggleExplorationChoice(complete, field, replacement)).toEqual({ ...complete, [field]: replacement })
  })

  it('recalculates progress when comparisons are removed and restored', () => {
    expect(progress(complete)).toBe(3)
    const fewerLevels = toggleExplorationChoice(complete, 'levels', '1/4')
    expect(progress(fewerLevels)).toBe(2)
    expect(progress(toggleExplorationChoice(fewerLevels, 'levels', '1/32'))).toBe(3)
    expect(progress({ ...complete, answer: '' })).toBe(2)
    expect(progress(toggleExplorationChoice(complete, 'motif', 'boats'))).toBe(2)
    expect(progress(toggleExplorationChoice(complete, 'palette', 'jade'))).toBe(2)
  })
})

describe('persisting incomplete and cleared exploration drafts', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('keeps a zero-progress draft so a saved card cannot replace it on reload', () => {
    const draft = { ...EMPTY_EXPLORATION, levels: ['1/32'] }
    expect(hasDraft()).toBe(false)
    writeDraft(draft)
    expect(progress(readDraft())).toBe(0)
    expect(hasDraft()).toBe(true)
    expect(readDraft()).toEqual(draft)
    writeDraft(toggleExplorationChoice(readDraft(), 'levels', '1/32'))
    expect(hasDraft()).toBe(true)
    expect(readDraft()).toEqual(EMPTY_EXPLORATION)
    clearDraft()
    expect(hasDraft()).toBe(false)
  })

  it('round-trips removed selections without restoring them', () => {
    writeDraft(complete)
    const next = toggleExplorationChoice(toggleExplorationChoice(readDraft(), 'levels', '1/4'), 'palette', 'jade')
    writeDraft({ ...next, answer: '' })
    expect(readDraft()).toEqual({ motif: 'boats', palette: '', levels: ['full'], answer: '' })
  })

  it('does not treat invalid storage as a draft that blocks a saved card', () => {
    for (const invalid of ['{broken', 'null', JSON.stringify({ ...complete, levels: [null] })]) {
      sessionStorage.setItem('jj_v2_exploration_draft', invalid)
      expect(hasDraft()).toBe(false)
      expect(readDraft()).toEqual(EMPTY_EXPLORATION)
    }
  })
})
