/** Keep service boundaries audible while removing formatting and link targets. */
export function sanitizeSpeechText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/gi, '')
    .replace(/https?:\/\/[^\s<>()\[\]，。；！？]+/gi, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+|^>\s+/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, star: string, underline: string) => star ?? underline)
    .replace(/\*([^*]+)\*|_([^_]+)_/g, (_, star: string, underline: string) => star ?? underline)
    .replace(/^\s*[-*•]\s+|^\s*\d+[.)、]\s+/gm, '')
    .replace(/[*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
