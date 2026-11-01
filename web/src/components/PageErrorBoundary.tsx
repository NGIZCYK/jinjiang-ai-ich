import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  language: 'zh' | 'en'
  homeTo?: string
  homeLabelZh?: string
  homeLabelEn?: string
}

export class PageErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    const zh = this.props.language === 'zh'
    const homeTo = this.props.homeTo ?? '/'
    const homeLabel = zh ? (this.props.homeLabelZh ?? '返回首页') : (this.props.homeLabelEn ?? 'Return home')
    return <section className="journey-card" role="alert">
      <h1>{zh ? '此页面暂时无法显示' : 'This page could not be displayed'}</h1>
      <p>{zh ? '可以返回继续浏览，或重试加载此页面。' : 'Return to continue browsing, or try loading this page again.'}</p>
      <div className="journey-actions">
        <Link className="btn-primary" to={homeTo}>{homeLabel}</Link>
        <button className="btn-ghost" onClick={() => this.setState({ failed: false })}>{zh ? '重试' : 'Try again'}</button>
      </div>
    </section>
  }
}
