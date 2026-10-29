export interface FeedbackSummary { count: number; averageRating: number | null }

export function feedbackStatistics(data: { feedback?: { rating: number }[]; feedbackSummary?: FeedbackSummary }) {
  const summary = data.feedbackSummary
  if (summary && Number.isInteger(summary.count) && summary.count >= 0
    && (summary.count === 0 ? summary.averageRating === null
      : typeof summary.averageRating === 'number' && Number.isFinite(summary.averageRating) && summary.averageRating >= 1 && summary.averageRating <= 5)) {
    return { ...summary, scope: 'all' as const }
  }
  const recent = data.feedback ?? []
  return { count: recent.length, averageRating: recent.length ? recent.reduce((sum,row) => sum+row.rating,0)/recent.length : null, scope: 'recent' as const }
}
