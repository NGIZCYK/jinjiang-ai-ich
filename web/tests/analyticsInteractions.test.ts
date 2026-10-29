// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { AnalyticsPage } from '../src/pages/AnalyticsPage'
import snapshot from '../public/analytics/analytics_snapshot.json'
const backend=vi.hoisted(()=>({rpc:vi.fn(),apiFetch:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({cloud:null,...backend}))
const sample={batch:'pilot-01',counts:[2,1,1,1,1,1,1,1],statusCounts:{completed:1},interests:[],guideIntent:{total:0,uniqueUsers:0,topicCounts:{},partyCounts:{},sentimentCounts:{},averageBudget:null,averageStayHours:null},feedback:Array.from({length:50},()=>({rating:5,comment:'',created_at:''})),feedbackSummary:{count:51,averageRating:251/51}}
beforeEach(()=>{localStorage.clear();backend.rpc.mockResolvedValue(sample);vi.stubGlobal('fetch',vi.fn(async()=>Response.json(snapshot)));backend.apiFetch.mockResolvedValue(Response.json({provider:'deepseek',brief:{headline:'Next study',decision:'pilot',rationale:'Collect more evidence',actions:[],scaleGate:'Validate',pauseGate:'Errors',limitation:'Synthetic forecasts are not trading results.'}}))})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
function show(){render(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(AnalyticsPage))))}
describe('analytics displayed evidence boundaries',()=>{
 it('shows full-cohort feedback and displays the source and AI limitations',async()=>{
  show();await screen.findByText('51')
  expect(screen.getByText('累计评分')).toBeTruthy();expect(screen.getByText('平均流程评分').parentElement?.querySelector('strong')?.textContent).toBe('4.9')
  fireEvent.click(screen.getByRole('tab',{name:'经营推演'}));await screen.findByText('数据来源与适用范围')
  fireEvent.click(screen.getByText('数据来源与适用范围'));expect(screen.getByText(snapshot.source)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'生成经营简报'}))
  expect(await screen.findByText('Synthetic forecasts are not trading results.')).toBeTruthy()
 })
 it('labels recent-only metrics when a previous backend has no whole-cohort summary',async()=>{
  backend.rpc.mockResolvedValue({...sample,feedbackSummary:undefined});show()
  expect(await screen.findByText('最近评分（最多50条）')).toBeTruthy()
  expect(screen.queryByText('累计评分')).toBeNull()
 })
})
