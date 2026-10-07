export type Role = 'guest' | 'ops'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export type { ICHItem, GuideSource } from '../../supabase/functions/_shared/guideContract.ts'
import type { GuideSource } from '../../supabase/functions/_shared/guideContract.ts'

export interface GuideAction {
  type: 'record_preference'
  slot: string
  durationMinutes?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  language?: 'zh' | 'en'
  sentiment?: 'positive' | 'neutral' | 'negative'
  sources?: GuideSource[]
  action?: GuideAction
  createdAt: number
}

export type GuidePartyType = 'solo' | 'family' | 'business' | 'unspecified'

/** 由导览对话提取的匿名经营标签；不保存用户原话或身份信息。 */
export interface GuideSignal {
  id: string
  sourceMessageId: string
  language: 'zh' | 'en'
  topics: string[]
  stayHours?: number
  budget?: number
  partyType: GuidePartyType
  sentiment: 'positive' | 'neutral' | 'negative'
  createdAt: number
}

export interface Booking {
  id: string
  userId: string
  itemId: string
  itemTitle: string
  slot: string
  status: 'confirmed' | 'cancelled'
  createdAt: number
}

export interface GeneratedContent {
  id: string
  userId: string
  type: 'itinerary' | 'copy'
  title: string
  content: string
  language?: 'zh' | 'en'
  createdAt: number
}

export interface AnalyticsSnapshot {
  generatedAt: string
  source: string
  method: string
  sampleSize: number
  segments: {
    id: string
    name: string
    nameEn: string
    share: number
    description: string
    descriptionEn: string
    avgSpendIndex: number
    avgStayHours: number
    avgRoomSpend: number
    avgInterest: number
    businessShare: number
    sampleCount: number
  }[]
  records: {
    id: string
    segmentId: string
    stayHours: number
    roomSpend: number
    interest: number
    isBusiness: boolean
    totalSpend: number
  }[]
  revenueScenarios: {
    id: string
    name: string
    nameEn: string
    baseRevenue: number
    ichAttachRate: number
    avgTicketUplift: number
    projectedRevenue: number
    defaults: {
      monthlyHotelGuests: number
      ticketPrice: number
      sessions: number
      seatsPerSession: number
      unitCost: number
      fixedMonthlyCost: number
      initialInvestment: number
    }
  }[]
  roi: {
    id: string
    name: string
    nameEn: string
    investment: number
    incrementalRevenue: number
    roiPct: number | null
    paybackMonths: number | null
  }[]
}
