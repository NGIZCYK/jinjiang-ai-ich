/** A coarse expression label, not a satisfaction score or emotion assessment. */
export function keywordSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  let negative = false
  const remainder = text
    // Negated criticism is not evidence of either satisfaction or dissatisfaction.
    .replace(/不(?:是|觉得|感到)?(?:很|太)?(?:差|无聊|失望|难|贵)|\bnot\s+(?:(?:very|too)\s+)?(?:bad|boring|disappointing|difficult|expensive)\b/gi, ' ')
    .replace(/(?:并不是|并不|不是|不太|不怎么|不再|不会|不想|不|没(?:有)?)\s*(?:很|太|特别|十分|真的)?\s*(?:喜欢|推荐|满意|好看|很棒|感动)|\b(?:don['’]t|do\s+not|didn['’]t|did\s+not|not|never)\s+(?:(?:really|very)\s+)?(?:like|love|recommend|enjoy|satisfied)\b/gi, () => {
      negative = true
      return ' '
    })
  negative ||= /差|不行|无聊|失望|太难|没意思|退款|太贵|不满意|\b(?:bad|boring|dislike|disappoint\w*|frustrat\w*|too\s+(?:difficult|expensive))\b/i.test(remainder)
  const positive = /喜欢|很棒|太美|感动|推荐|惊艳|好美|赞|满意|\b(?:like|love|great|beautiful|amazing|recommend|enjoy|satisfied)\b/i.test(remainder)
  if (positive && negative) return 'neutral'
  return negative ? 'negative' : positive ? 'positive' : 'neutral'
}
