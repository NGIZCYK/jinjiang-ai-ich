/**
 * 中英文句子切分器（任务书阶段C规范）
 * 1. 中文终止符：。！？；\n，英文终止符：. ! ? ; \n；
 * 2. 避免误切小数（1.5）、工艺比例（1/16）、英文缩写（e.g.、Mr.）和网址；
 * 3. 单句过短时（中文<8字，英文<20字符）与下一段合并；
 * 4. 单句过长时（中文>120字，英文>260字符）在逗号或冒号处软分句；
 * 5. 支持流式 feed(chunk) 与结束 flush()。
 */

export interface SentenceSegmenterOptions {
  language?: 'zh' | 'en'
  minZhLength?: number
  minEnLength?: number
  maxZhLength?: number
  maxEnLength?: number
}

const COMMON_ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'no',
  'st',
  'vol',
  'gen',
  'approx',
])

export class SentenceSegmenter {
  private buffer = ''
  private language: 'zh' | 'en'
  private minLength: number
  private maxLength: number

  constructor(options: SentenceSegmenterOptions = {}) {
    this.language = options.language || 'zh'
    this.minLength = this.language === 'zh' ? (options.minZhLength ?? 8) : (options.minEnLength ?? 20)
    this.maxLength = this.language === 'zh' ? (options.maxZhLength ?? 120) : (options.maxEnLength ?? 260)
  }

  setLanguage(lang: 'zh' | 'en') {
    this.language = lang
    this.minLength = lang === 'zh' ? 8 : 20
    this.maxLength = lang === 'zh' ? 120 : 260
  }

  /**
   * 接收增量文本，提取已闭合的完整句子
   */
  feed(chunk: string): string[] {
    this.buffer += chunk
    const sentences: string[] = []

    while (this.buffer.length > 0) {
      const cutIndex = this.findNextCutIndex()
      if (cutIndex === -1) {
        // 如果当前缓冲区已超出单句最大长度限制，寻找次级标点（逗号/冒号）软切分
        if (this.buffer.length >= this.maxLength) {
          const softIndex = this.findSoftCutIndex()
          if (softIndex !== -1) {
            const sentence = this.buffer.slice(0, softIndex + 1).trim()
            this.buffer = this.buffer.slice(softIndex + 1)
            if (sentence) sentences.push(cleanMarkdownForSpeech(sentence))
            continue
          }
        }
        break
      }

      const candidate = this.buffer.slice(0, cutIndex + 1).trim()
      // 判断候选句是否达到最小朗读长度要求；若太短且缓冲区后方还有内容，暂不切断继续累积
      if (candidate.length < this.minLength && cutIndex + 1 < this.buffer.length) {
        break
      }

      const sentence = this.buffer.slice(0, cutIndex + 1).trim()
      this.buffer = this.buffer.slice(cutIndex + 1)
      if (sentence) {
        sentences.push(cleanMarkdownForSpeech(sentence))
      }
    }

    return sentences
  }

  /**
   * 流式生成完毕时冲刷输出剩余文本
   */
  flush(): string[] {
    const remaining = this.buffer.trim()
    this.buffer = ''
    if (!remaining) return []
    const cleaned = cleanMarkdownForSpeech(remaining)
    return cleaned ? [cleaned] : []
  }

  /**
   * 重置分句器内部状态
   */
  reset(): void {
    this.buffer = ''
  }

  private findNextCutIndex(): number {
    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i]

      // 中文主要终止符
      if (char === '。' || char === '！' || char === '？' || char === '；') {
        return i
      }

      // 换行符（且前文有内容）
      if (char === '\n') {
        // 如果前一个字符是普通字符，可作为段落闭合
        if (i > 0 && this.buffer.slice(0, i).trim().length >= this.minLength) {
          return i
        }
      }

      // 英文终止符：! ? ;
      if (char === '!' || char === '?' || char === ';') {
        return i
      }

      // 英文句号 '.' 的特殊防误切保护
      if (char === '.') {
        // 1. 小数防误切：如 1.5, 3.14
        const prevChar = i > 0 ? this.buffer[i - 1] : ''
        const nextChar = i + 1 < this.buffer.length ? this.buffer[i + 1] : ''
        if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
          continue
        }

        // 2. 网址或代码路径防误切：如 api.deepseek.com
        if (/[a-zA-Z]/.test(prevChar) && /[a-zA-Z]/.test(nextChar)) {
          continue
        }

        // 3. 常见缩写防误切：如 e.g., Mr., Dr., vs.
        const precedingWordMatch = this.buffer.slice(0, i).match(/\b([a-zA-Z]{1,6})$/)
        if (precedingWordMatch) {
          const word = precedingWordMatch[1].toLowerCase()
          if (COMMON_ABBREVIATIONS.has(word)) {
            continue
          }
        }

        // 英文句号后通常跟随空格、换行或结尾
        if (nextChar === '' || /\s/.test(nextChar) || nextChar === '"' || nextChar === '”') {
          return i
        }
      }
    }

    return -1
  }

  private findSoftCutIndex(): number {
    // 超长句在逗号或冒号处分段，在 [maxLength * 0.6, maxLength] 区间倒序寻找最合适的逗号
    const searchLimit = Math.min(this.buffer.length, this.maxLength)
    const softDelimiters = this.language === 'zh' ? ['，', '：', '、', ' '] : [',', ':', ' ']

    for (let i = searchLimit - 1; i >= Math.floor(searchLimit * 0.5); i--) {
      if (softDelimiters.includes(this.buffer[i])) {
        return i
      }
    }

    return -1
  }
}

/**
 * 清除句子中的 Markdown 格式符号以适合语音播报
 */
export function cleanMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`([^`]+)`/g, '$1') // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 链接文字
    .replace(/^[#*>-]+\s+/gm, '') // 标题、列表、引用标记
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
    .replace(/\*([^*]+)\*/g, '$1') // 斜体
    .replace(/~~.*?~~/g, '') // 删除线
    .replace(/^[0-9]+[.)]\s+/gm, '') // 数字序号
    .replace(/\n+/g, ' ') // 连续换行转为空格
    .trim()
}

/**
 * 快捷函数：一次性切分整段文本
 */
export function splitIntoSentences(text: string, language: 'zh' | 'en' = 'zh'): string[] {
  const segmenter = new SentenceSegmenter({ language })
  const firstBatch = segmenter.feed(text)
  const flushed = segmenter.flush()
  return [...firstBatch, ...flushed]
}
