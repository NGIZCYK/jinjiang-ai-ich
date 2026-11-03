// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react'

const createClient = vi.hoisted(() => vi.fn())
vi.mock('@supabase/supabase-js', () => ({ createClient }))
beforeEach(() => {
  vi.resetModules(); sessionStorage.clear(); localStorage.clear(); createClient.mockClear()
  vi.stubEnv('MODE', 'atelier-preview')
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-only')
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

it('never constructs a cloud client even when credentials exist and cannot make an API request', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  try {
    const { cloud, apiFetch, rpc } = await import('../src/lib/cloud')
    expect(cloud).toBeNull(); expect(createClient).not.toHaveBeenCalled()
    expect((await apiFetch('/api/chat')).status).toBe(503)
    await expect(rpc('save_exploration')).rejects.toThrow('云端连接已关闭')
    expect(fetchSpy).not.toHaveBeenCalled()
  } finally { fetchSpy.mockRestore() }
})
it('isolates local drafts and saves, preserves old drafts, and restores after reset', async () => {
  const legacy = { motif: 'gate', palette: 'gold', levels: ['full'], answer: '' }
  sessionStorage.setItem('jj_v2_exploration_draft', JSON.stringify(legacy))
  const store = await import('../src/lib/journeyStore')
  expect(store.readDraft().motif).toBe('')
  const floral = { ...legacy, motif: 'huayun-stamen', levels: ['full', '1/4'], answer: 'relative' }
  store.writeDraft(floral)
  expect(store.readDraft()).toEqual(floral)
  await store.useJourneyStore.getState().saveExploration(floral)
  store.clearDraft(); store.useJourneyStore.getState().reset()
  await store.useJourneyStore.getState().refresh()
  expect(store.useJourneyStore.getState().exploration).toEqual(floral)
  expect(JSON.parse(sessionStorage.getItem('jj_v2_exploration_draft')!)).toEqual(legacy)
  expect(createClient).not.toHaveBeenCalled()
})
it('lets a visitor select, deselect, save and restore a local card without signing in', async () => {
  const { MemoryRouter } = await import('react-router-dom')
  const { LanguageProvider } = await import('../src/lib/i18n')
  const { ExplorationTask } = await import('../src/components/ExplorationTask')
  const { useJourneyStore, readDraft } = await import('../src/lib/journeyStore')
  function show() { return render(<LanguageProvider><MemoryRouter><ExplorationTask onFocus={() => {}} /></MemoryRouter></LanguageProvider>) }
  const first = show()
  fireEvent.click(screen.getByRole('button', { name: '花蕊细节' }))
  expect(readDraft().motif).toBe('huayun-stamen')
  fireEvent.click(screen.getByRole('button', { name: '花蕊细节' }))
  expect(readDraft().motif).toBe('')
  fireEvent.click(screen.getByRole('button', { name: '白瓣明暗' }))
  fireEvent.click(screen.getByRole('button', { name: '保存本地探索卡' }))
  await screen.findByText('探索卡已保存在当前浏览器标签页。')
  expect(useJourneyStore.getState().exploration?.motif).toBe('huayun-white-petal')
  first.unmount(); show()
  await waitFor(() => expect(screen.getByRole('button', { name: '白瓣明暗' }).getAttribute('aria-pressed')).toBe('true'))
  expect(screen.queryByRole('link', { name: '登录后保存' })).toBeNull()
  expect(createClient).not.toHaveBeenCalled()
})
