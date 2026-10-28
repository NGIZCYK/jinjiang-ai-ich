import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export class PageErrorBoundary extends Component<{children:ReactNode; language:'zh'|'en'}, {failed:boolean}> {
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(!this.state.failed)return this.props.children
  const zh=this.props.language==='zh'
  return <section className="journey-card" role="alert">
   <h1>{zh?'此页面暂时无法显示':'This page could not be displayed'}</h1>
   <p>{zh?'可以返回首页继续浏览，或重试加载此页面。':'Return home to continue browsing, or try loading this page again.'}</p>
   <div className="journey-actions"><Link className="btn-primary" to="/">{zh?'返回首页':'Return home'}</Link><button className="btn-ghost" onClick={()=>this.setState({failed:false})}>{zh?'重试':'Try again'}</button></div>
  </section>
 }
}
