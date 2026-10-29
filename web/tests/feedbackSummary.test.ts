import { describe, expect, it } from 'vitest'
import { feedbackStatistics } from '../../supabase/functions/_shared/feedbackSummary'
import { behaviorExport } from '../src/lib/analyticsExport'
import { continuationPath } from '../src/lib/journeyFlow'
import type { TrialData } from '../src/components/TrialDashboard'

describe('feedback summary compatibility and exports',()=>{
 const feedback=Array.from({length:50},()=>({rating:5,comment:'Private',created_at:''}))
 it('uses server totals, while explicitly limiting the scope for an older backend',()=>{
  expect(feedbackStatistics({feedback,feedbackSummary:{count:51,averageRating:251/51}})).toEqual({count:51,averageRating:251/51,scope:'all'})
  expect(feedbackStatistics({feedback})).toEqual({count:50,averageRating:5,scope:'recent'})
 })
 it('exports server totals and never claims a recent-only average is the whole cohort',()=>{
  const data:TrialData={batch:'demo',counts:[],feedback,feedbackSummary:{count:51,averageRating:251/51},statusCounts:{},interests:[],guideIntent:{total:0,uniqueUsers:0,topicCounts:{},partyCounts:{},sentimentCounts:{},averageBudget:null,averageStayHours:null}}
  const csv=behaviorExport(data)
  expect(csv).toContain('"feedback_count","51"');expect(csv).toContain('"feedback_scope","all"');expect(csv).not.toContain('Private')
  expect(behaviorExport({...data,feedbackSummary:undefined})).toContain('"feedback_scope","recent"')
 })
 it.each(['https://other.example','//other.example','/auth','/my\\evil','/guide\nother'])('rejects an unsafe continuation: %s',path=>{expect(continuationPath(path)).toBeNull()})
})
