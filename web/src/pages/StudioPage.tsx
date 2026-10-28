import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import type { GeneratedContent } from '../types'
import { Notice } from '../components/JourneyCommon'
import { AUDIENCES, CHANNELS, itineraryDuration, decodeStudioContent, encodeStudioContent, generateStudioDraft, studioMarkdown, type StudioDraft, type StudioInputs } from '../lib/studio'
import { downloadText, printText } from '../lib/export'

function initialInputs(params: URLSearchParams, language: 'zh'|'en'): StudioInputs {
  const segment = params.get('segment')
  const audience = segment === 'business-efficiency' ? 'business' : segment === 'culture-led' ? 'culture' : segment === 'family-leisure' ? 'leisure' : 'weekend'
  return { task:'itinerary', audience, channel:'signage', minutes:90, theme:language==='zh'?'苏州长卷与苏绣工艺':'Suzhou scroll and Su embroidery', language }
}
export function StudioPage() {
  const {language}=useLanguage(), zh=language==='zh', t=(a:string,b:string)=>zh?a:b
  const [params]=useSearchParams()
  const [inputs,setInputs]=useState<StudioInputs>(()=>initialInputs(params,language))
  const [context,setContext]=useState<StudioInputs|null>(null)
  const [title,setTitle]=useState(''),[body,setBody]=useState('')
  const [provider,setProvider]=useState<StudioDraft['provider']|'saved'>('saved')
  const [checks,setChecks]=useState([false,false,false]),[notes,setNotes]=useState(''),[approved,setApproved]=useState(false)
  const [saved,setSaved]=useState(false)
  const [stale,setStale]=useState(false),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false)
  const [message,setMessage]=useState(''),[failed,setFailed]=useState(false)
  const [search,setSearch]=useState(''),[typeFilter,setTypeFilter]=useState('all'),[languageFilter,setLanguageFilter]=useState('all')
  const contents=useAppStore(s=>s.contents), addContent=useAppStore(s=>s.addContent), refresh=useAppStore(s=>s.refreshContents)
  const controller=useRef<AbortController|null>(null), request=useRef(0)
  useEffect(()=>()=>{request.current++;controller.current?.abort()},[])
  useEffect(()=>{const segment=params.get('segment');if(segment){setInputs(current=>({...current,audience:initialInputs(params,language).audience}));setStale(true);invalidate()}},[params.get('segment')])
  function invalidate(){setSaved(false);setApproved(false);setChecks([false,false,false]);setNotes('');setMessage('')}
  function change(patch:Partial<StudioInputs>){setInputs(current=>({...current,...patch}));if(body)setStale(true);invalidate()}
  async function generate(){
    controller.current?.abort();const abort=new AbortController();controller.current=abort
    const version=++request.current;setBusy(true);setFailed(false);setMessage('');invalidate()
    const captured={...inputs,language}
    try{const draft=await generateStudioDraft(captured,abort.signal);if(version!==request.current)return
      setContext(captured);setTitle(draft.title);setBody(studioMarkdown(draft));setProvider(draft.provider);setStale(false)
    }catch{if(!abort.signal.aborted){setFailed(true);setMessage(t('生成失败，请重试。','Generation failed. Please retry.'))}}
    finally{if(version===request.current)setBusy(false)}
  }
  const duration=context?itineraryDuration(body,context):null
  const canApprove=Boolean(duration?.valid&&body.trim()&&title.trim()&&context&&!stale&&checks.every(Boolean)&&notes.trim())
  async function save(){
    if(!approved||!canApprove||!context)return
    const content=encodeStudioContent(body,context,provider)
    if(content.length>30000){setFailed(true);setMessage(t('内容过长，请缩短正文后重新审核。','Shorten the content and review it again.'));return}
    setSaving(true);setFailed(false)
    try{await addContent(context.task,title.trim(),content,context.language,notes.trim());setSaved(true);setMessage(t('已保存到内容库，原有记录保留。','Saved to the content library; earlier records are preserved.'))}
    catch(e){setFailed(true);setMessage(e instanceof Error?e.message:t('保存失败','Save failed'))}finally{setSaving(false)}
  }
  function open(item:GeneratedContent){
    controller.current?.abort();request.current++;setBusy(false)
    const decoded=decodeStudioContent(item.content), captured=decoded.inputs??{...initialInputs(new URLSearchParams(),item.language??'zh'),task:item.type,language:item.language??'zh'}
    setInputs(captured);setContext(captured);setTitle(item.title);setBody(decoded.body);setProvider(decoded.provider??'saved');setStale(false);invalidate()
  }
  async function copy(){try{await navigator.clipboard.writeText(body);setFailed(false);setMessage(t('正文已复制。','Content copied.'))}catch{setFailed(true);setMessage(t('无法自动复制，请在正文框内选择并复制。','Select and copy the text in the editor.'))}}
  const items=contents.filter(item=>(typeFilter==='all'||item.type===typeFilter)&&(languageFilter==='all'||(item.language??'zh')===languageFilter)
    &&(item.title+' '+decodeStudioContent(item.content).body).toLowerCase().includes(search.toLowerCase()))
  const names=zh?['已核对作品与资料来源','已核对工艺表述与时长','已核对客群、渠道与行动引导']:['References checked','Craft and duration checked','Audience, channel and next action checked']
  const fileName=(title||'studio-content').replace(/[\\/:*?"<>|]/g,'-').slice(0,100)
  return <div className="ops-page studio-page enhanced-studio">
    <header className="ops-masthead"><div><p className="eyebrow">CONTENT STUDIO</p><h1>{t('苏绣内容工作台','Su Embroidery Content Studio')}</h1><p>{t('输入住客与渠道需求，生成有依据的内容，审核后保存到内容库。','Turn guest and channel needs into grounded content, review it and save it to your library.')}</p></div><a className="btn-ghost" href="#content-library">{t('打开内容库','Open content library')} · {contents.length}</a></header>
    <ol className="studio-workflow" aria-label={t('内容工作流','Content workflow')}><li>01 · {t('定义需求','Define needs')}</li><li>02 · {t('生成与编辑','Generate and edit')}</li><li>03 · {t('审核与保存','Review and save')}</li></ol>
    <section className="journey-card"><h2>{t('01 · 内容需求','01 · Content brief')}</h2><fieldset disabled={busy||saving} className="studio-brief-grid">
      <label>{t('内容类型','Content type')}<select className="input" value={inputs.task} onChange={e=>change({task:e.target.value as StudioInputs['task']})}><option value="itinerary">{t('住客体验行程','Guest itinerary')}</option><option value="copy">{t('酒店推广文案','Hotel promotion')}</option></select></label>
      <label>{t('目标客群','Target guests')}<select className="input" value={inputs.audience} onChange={e=>change({audience:e.target.value as StudioInputs['audience']})}>{Object.entries(AUDIENCES).map(([id,name])=><option key={id} value={id}>{name[zh?0:1]}</option>)}</select></label>
      <label>{t('触达渠道','Channel')}<select className="input" value={inputs.channel} onChange={e=>change({channel:e.target.value as StudioInputs['channel']})}>{Object.entries(CHANNELS).map(([id,name])=><option key={id} value={id}>{name[zh?0:1]}</option>)}</select></label>
      <label>{t('可用时长','Available time')}<select className="input" value={inputs.minutes} onChange={e=>change({minutes:Number(e.target.value)})}>{[60,90,120,180].map(n=><option key={n} value={n}>{n} {t('分钟','min')}</option>)}</select></label>
      <label className="studio-theme">{t('内容主题','Theme')}<input className="input" maxLength={180} required value={inputs.theme} onChange={e=>change({theme:e.target.value})}/></label>
    </fieldset><button className="btn-primary" disabled={busy||saving||!inputs.theme.trim()} onClick={()=>void generate()}>{busy?t('正在生成…','Generating…'):t(body?'重新生成草稿':'生成草稿',body?'Regenerate draft':'Generate draft')}</button></section>
    {body&&<section className="journey-card"><div className="journey-heading"><h2>{t('02 · 编辑内容','02 · Edit content')}</h2><span className="status-pill">{provider==='deepseek'?'DeepSeek':provider==='template'?t('内容模板','Content template'):t('已存内容','Saved content')} · {context?.language==='zh'?'中文':'English'}</span></div>
      {stale&&<Notice>{t('需求参数已变更，请重新生成后再审核。当前正文保留。','Brief changed. Regenerate before review; the current text is retained.')}</Notice>}
      <fieldset disabled={busy||saving}><label>{t('内容标题','Content title')}<input className="input" maxLength={200} value={title} onChange={e=>{setTitle(e.target.value);invalidate()}}/></label><label className="studio-body-label">{t('正文语言','Draft language')}<select className="input" value={context?.language??language} onChange={e=>{const actualLanguage=e.target.value as 'zh'|'en';setContext(current=>current?{...current,language:actualLanguage}:null);invalidate()}}><option value="zh">中文</option><option value="en">English</option></select></label><label className="studio-body-label">{t('正文','Content')}<textarea className="input studio-body-editor" maxLength={28000} value={body} onChange={e=>{setBody(e.target.value);invalidate()}}/></label></fieldset>
      <div className="journey-actions"><button className="btn-ghost" onClick={()=>void copy()}>{t('复制正文','Copy content')}</button><button className="btn-ghost" onClick={()=>downloadText(fileName+'.md',body.trim(),'text/markdown;charset=utf-8')}>{t('下载 Markdown','Download Markdown')}</button><button className="btn-ghost" onClick={()=>printText(title,body.trim())}>{t('打印内容','Print content')}</button></div>
    </section>}
    {body&&<section className="journey-card"><div className="journey-heading"><h2>{t('03 · 审核与保存','03 · Review and save')}</h2><span className="status-pill">{approved?t('审核通过','Approved'):t('待审核','Review pending')}</span></div><fieldset disabled={busy||saving||stale}>
      {duration&&!duration.valid&&<Notice error>{t(`请保留 4 个分段时长标题，合计应为 ${context?.minutes} 分钟（当前 ${duration.total} 分钟）。`,`Keep four timed section headings totalling ${context?.minutes} min (currently ${duration.total} min).`)}</Notice>}
      <div className="studio-checks">{names.map((name,index)=><label key={index}><input type="checkbox" checked={checks[index]} onChange={e=>{setChecks(current=>current.map((v,i)=>i===index?e.target.checked:v));setApproved(false)}}/>{name}</label>)}</div>
      <label>{t('审核意见','Review notes')}<textarea className="input" value={notes} maxLength={1500} placeholder={t('填写本次核对结果与修改意见','Record the checks and changes you made')} onChange={e=>{setNotes(e.target.value);setApproved(false)}}/></label>
      <div className="journey-actions"><button className="btn-ghost" disabled={!canApprove} onClick={()=>setApproved(true)}>{t('确认审核通过','Approve content')}</button><button className="btn-primary" disabled={saving||saved||!approved||!canApprove} onClick={()=>void save()}>{saving?t('保存中…','Saving…'):t('保存到内容库','Save to content library')}</button></div>
    </fieldset></section>}
    {message&&<Notice error={failed}>{message}</Notice>}
    <section className="journey-card" id="content-library"><div className="journey-heading"><h2>{t('内容库','Content library')} · {items.length}</h2><button className="btn-ghost" onClick={()=>void refresh().catch(e=>{setFailed(true);setMessage(String(e.message))})}>{t('刷新内容库','Refresh library')}</button></div>
      <div className="studio-library-filters"><label>{t('搜索内容','Search content')}<input className="input" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>{t('类型','Type')}<select className="input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="all">{t('全部','All')}</option><option value="itinerary">{t('行程','Itinerary')}</option><option value="copy">{t('推广文案','Promotion')}</option></select></label><label>{t('正文语言','Content language')}<select className="input" value={languageFilter} onChange={e=>setLanguageFilter(e.target.value)}><option value="all">{t('全部','All')}</option><option value="zh">中文</option><option value="en">English</option></select></label></div>
      {!items.length&&<p>{t('暂无符合条件的内容。完成审核后可保存第一份。','No matching content. Review and save your first draft.')}</p>}
      <div className="studio-library-list">{items.map(item=><article key={item.id}><h3>{item.title}</h3><p>{item.language==='en'?'English':'中文'} · {new Date(item.createdAt).toLocaleString(zh?'zh-CN':'en-GB')} · {item.reviewStatus==='approved'?t('已审核','Approved'):t('已保存','Saved')}</p><p>{decodeStudioContent(item.content).body.slice(0,160)}</p>{item.auditNotes&&<p>{t('审核意见：','Review: ')}{item.auditNotes}</p>}<button className="btn-ghost" onClick={()=>open(item)}>{t('打开为新草稿','Open as a new draft')}</button></article>)}</div>
    </section>
  </div>
}
