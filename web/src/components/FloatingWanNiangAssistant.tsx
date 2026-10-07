import { useState } from 'react'

type FloatingWanNiangAssistantProps = {
  active?: boolean
  disabled?: boolean
  onPrompt: (prompt: string) => void
}

const prompts = [
  '讲讲苏绣劈丝工艺',
  '住客可以预约哪些苏绣体验？',
  '推荐苏州短途游玩线索',
]

/**
 * 从导入包中拆出的浮动婉娘入口。
 * 它只负责呈现和把预设问题交给导览页既有的 AI 问答，
 * 不重复创建聊天记录，也不拦截其他页面的链接。
 */
export function FloatingWanNiangAssistant({
  active = false,
  disabled = false,
  onPrompt,
}: FloatingWanNiangAssistantProps) {
  const [open, setOpen] = useState(false)

  function choosePrompt(prompt: string) {
    if (disabled) return
    onPrompt(prompt)
    setOpen(false)
  }

  return (
    <aside className="guide-floating-wanniang" aria-label="婉娘快捷提问">
      <section id="guide-floating-wanniang-panel" className={`guide-floating-wanniang-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="guide-floating-wanniang-heading">
          <div>
            <p>WANNIANG</p>
            <h2>婉娘 · 苏绣礼宾</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭快捷提问">×</button>
        </div>
        <p>选一句开始，婉娘会在右侧对话中为您回答。</p>
        <div className="guide-floating-wanniang-options">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" disabled={disabled} onClick={() => choosePrompt(prompt)}>
              {prompt}<span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className={`guide-floating-wanniang-avatar ${active ? 'is-active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="guide-floating-wanniang-panel"
        aria-label={open ? '收起婉娘快捷提问' : '打开婉娘快捷提问'}
      >
        <svg viewBox="0 0 300 300" aria-hidden="true" focusable="false">
          <circle cx="150" cy="150" r="148" fill="#e8e1d3" />
          <circle cx="150" cy="150" r="132" fill="#faf6ee" />
          <path d="M70 140 C70 90, 120 50, 150 50 C180 50, 230 90, 230 140 L230 210 L210 210 L210 150 C210 110, 180 80, 150 80 C120 80, 90 110, 90 150 L90 210 L70 210 Z" fill="#2b2520" />
          <ellipse cx="150" cy="155" rx="42" ry="50" fill="#f3d9c7" />
          <ellipse cx="132" cy="150" rx="3.2" ry="4.5" fill="#222" />
          <ellipse cx="168" cy="150" rx="3.2" ry="4.5" fill="#222" />
          <path d="M120 140 C126 136, 138 136, 144 140" stroke="#3a2f28" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M156 140 C162 136, 174 136, 180 140" stroke="#3a2f28" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="124" cy="168" r="5" fill="#e9b5a8" opacity="0.5" />
          <circle cx="176" cy="168" r="5" fill="#e9b5a8" opacity="0.5" />
          <g className="guide-floating-wanniang-mouth"><ellipse cx="150" cy="178" rx="5.5" ry="3" fill="#b55149" /></g>
          <path d="M50 290 C50 240, 100 210, 150 210 C200 210, 250 240, 250 290 Z" fill="#3c5c52" />
          <path d="M70 290 C70 250, 110 225, 150 225 C190 225, 230 250, 230 290 Z" fill="#5f8275" />
          <path d="M90 250 C110 242, 130 254, 150 246 C170 238, 190 250, 210 242" stroke="#d8c77a" strokeWidth="2" fill="none" />
          <path d="M90 270 C110 262, 135 274, 155 266 C175 258, 195 270, 215 262" stroke="#e8d9a0" strokeWidth="2" fill="none" />
          <g className="guide-floating-wanniang-hand-left"><circle cx="110" cy="130" r="10" fill="#f3d9c7" /><path d="M110 140 L110 160" stroke="#f3d9c7" strokeWidth="7" strokeLinecap="round" /></g>
          <g className="guide-floating-wanniang-hand-right"><circle cx="180" cy="130" r="10" fill="#f3d9c7" /><path d="M180 140 L180 158" stroke="#f3d9c7" strokeWidth="7" strokeLinecap="round" /></g>
        </svg>
      </button>
    </aside>
  )
}
