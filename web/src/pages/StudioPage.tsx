import { readStudioDraft, writeStudioDraft, removeStudioDraft } from '../lib/studioDraft'
import { actionError } from '../lib/actionErrors'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import type { GeneratedContent } from '../types'
import { OpsEmpty, OpsNotice, OpsPageHeader, OpsTabs } from '../components/ops/OpsUI'
import { AUDIENCES, CHANNELS, itineraryDuration, decodeStudioContent, encodeStudioContent, generateStudioDraft, studioMarkdown, type StudioDraft, type StudioInputs } from '../lib/studio'
import { downloadText, printText } from '../lib/export'

function initialInputs(params: URLSearchParams, language: 'zh' | 'en'): StudioInputs {
  const segment = params.get('segment')
  const audience = segment === 'business-efficiency' ? 'business' : segment === 'culture-led' ? 'culture' : segment === 'family-leisure' ? 'leisure' : 'weekend'
  return { task: 'itinerary', audience, channel: 'signage', minutes: 90, theme: language === 'zh' ? '苏州长卷与苏绣工艺' : 'Suzhou scroll and Su embroidery', language }
}

export function StudioPage() {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const t = (a: string, b: string) => zh ? a : b
  const [params] = useSearchParams()
  const owner = useAppStore(s => s.user?.id) ?? 'visitor'
  const [view, setView] = useState<'workbench' | 'library'>('workbench')
  const [restored] = useState(() => readStudioDraft(owner))
  const [draftStatus, setDraftStatus] = useState<'saved' | 'unavailable' | 'empty'>(restored ? 'saved' : 'empty')
  const [inputs, setInputs] = useState<StudioInputs>(() => restored?.inputs ?? initialInputs(params, language))
  const [context, setContext] = useState<StudioInputs | null>(restored?.context ?? null)
  const [title, setTitle] = useState(restored?.title ?? '')
  const [body, setBody] = useState(restored?.body ?? '')
  const [provider, setProvider] = useState<StudioDraft['provider'] | 'saved'>(restored?.provider ?? 'saved')
  const [checks, setChecks] = useState([false, false, false])
  const [notes, setNotes] = useState(restored?.notes ?? '')
  const [approved, setApproved] = useState(false)
  const [saveId, setSaveId] = useState(() => crypto.randomUUID())
  const [saved, setSaved] = useState(false)
  const [stale, setStale] = useState(restored?.stale ?? false)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const contents = useAppStore(s => s.contents)
  const addContent = useAppStore(s => s.addContent)
  const refresh = useAppStore(s => s.refreshContents)
  const controller = useRef<AbortController | null>(null)
  const request = useRef(0)

  useEffect(() => () => { request.current++; controller.current?.abort() }, [])
  useEffect(() => {
    const segment = params.get('segment')
    if (segment && initialInputs(params, language).audience !== inputs.audience) {
      setInputs(current => ({ ...current, audience: initialInputs(params, language).audience }))
      setStale(true)
      invalidate()
    }
  }, [params.get('segment')])

  function stash() {
    const ok = writeStudioDraft(owner, { inputs, context, title, body, notes, checks, provider, stale })
    setDraftStatus(ok ? 'saved' : 'unavailable')
    return ok
  }
  const latestDraft = useRef({ inputs, context, title, body, notes, checks, provider, stale })
  latestDraft.current = { inputs, context, title, body, notes, checks, provider, stale }
  const savedRef = useRef(saved)
  savedRef.current = saved
  useEffect(() => () => {
    const current = latestDraft.current
    if (!savedRef.current && (current.body.trim() || current.title.trim())) writeStudioDraft(owner, current)
  }, [owner])
  useEffect(() => {
    if (saved) { removeStudioDraft(owner); setDraftStatus('empty'); return }
    if (!body.trim() && !title.trim()) return
    const timer = setTimeout(() => { stash() }, 500)
    return () => clearTimeout(timer)
  }, [owner, inputs, context, title, body, notes, checks, provider, stale, saved])
  useEffect(() => {
    if (!body.trim() || saved) return
    const warn = (event: BeforeUnloadEvent) => { stash(); event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [body, saved])

  function confirmReplace() {
    return !body.trim() || saved || window.confirm(t('此操作会替换当前正文。需要保留时，请先下载草稿。继续吗？', 'This replaces the current text. Download a copy first if you need it. Continue?'))
  }
  function invalidate() {
    setSaved(false)
    setApproved(false)
    setChecks([false, false, false])
    setNotes('')
    setMessage('')
  }
  function change(patch: Partial<StudioInputs>) {
    setInputs(current => ({ ...current, ...patch }))
    if (body) setStale(true)
    invalidate()
  }
  async function generate() {
    if (!confirmReplace()) return
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    const version = ++request.current
    setBusy(true)
    setFailed(false)
    setMessage('')
    invalidate()
    const captured = { ...inputs, language }
    try {
      const draft = await generateStudioDraft(captured, abort.signal)
      if (version !== request.current) return
      setContext(captured)
      setTitle(draft.title)
      setBody(studioMarkdown(draft))
      setProvider(draft.provider)
      setStale(false)
    } catch {
      if (!abort.signal.aborted) {
        setFailed(true)
        setMessage(t('生成失败，请重试。', 'Generation failed. Please retry.'))
      }
    } finally {
      if (version === request.current) setBusy(false)
    }
  }
  const duration = context ? itineraryDuration(body, context) : null
  const canApprove = Boolean(duration?.valid && body.trim() && title.trim() && context && !stale && checks.every(Boolean) && notes.trim())
  async function save() {
    if (!approved || !canApprove || !context) return
    const content = encodeStudioContent(body, context, provider)
    if (content.length > 30000) {
      setFailed(true)
      setMessage(t('内容过长，请缩短正文后重新审核。', 'Shorten the content and review it again.'))
      return
    }
    setSaving(true)
    setFailed(false)
    try {
      await addContent(context.task, title.trim(), content, context.language, notes.trim(), saveId)
    } catch (e) {
      setFailed(true)
      setMessage(actionError(e, language))
      setSaving(false)
      return
    }
    setSaved(true)
    setMessage(t('已保存到内容库，原有记录保留。', 'Saved to the content library; earlier records are preserved.'))
    try {
      await refresh()
    } catch {
      setFailed(false)
      setMessage(t('内容已保存，但内容库刷新失败，请稍后点击刷新内容库。', 'Content saved, but the library could not refresh. Refresh the library shortly.'))
    }
    setSaving(false)
  }
  function open(item: GeneratedContent) {
    if (!confirmReplace()) return
    controller.current?.abort()
    request.current++
    setBusy(false)
    const decoded = decodeStudioContent(item.content)
    const captured = decoded.inputs ?? { ...initialInputs(new URLSearchParams(), item.language ?? 'zh'), task: item.type, language: item.language ?? 'zh' }
    setInputs(captured)
    setContext(captured)
    setTitle(item.title)
    setBody(decoded.body)
    setProvider(decoded.provider ?? 'saved')
    setStale(false)
    invalidate()
    setView('workbench')
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(body)
      setFailed(false)
      setMessage(t('正文已复制。', 'Content copied.'))
    } catch {
      setFailed(true)
      setMessage(t('无法自动复制，请在正文框内选择并复制。', 'Select and copy the text in the editor.'))
    }
  }
  const items = contents.filter(item => (typeFilter === 'all' || item.type === typeFilter) && (languageFilter === 'all' || (item.language ?? 'zh') === languageFilter)
    && (item.title + ' ' + decodeStudioContent(item.content).body).toLowerCase().includes(search.toLowerCase()))
  const names = zh ? ['已核对作品与资料来源', '已核对工艺表述与时长', '已核对客群、渠道与行动引导'] : ['References checked', 'Craft and duration checked', 'Audience, channel and next action checked']
  const fileName = (title || 'studio-content').replace(/[\\/:*?"<>|]/g, '-').slice(0, 100)

  return <div className="ops-page ops-studio">
    <OpsPageHeader
      eyebrow="CONTENT STUDIO"
      title={t('苏绣内容工作台', 'Su Embroidery Content Studio')}
      description={t('输入住客与渠道需求，生成有依据的内容，审核后保存到内容库。', 'Turn guest and channel needs into grounded content, review it and save it to your library.')}
      actions={<>
        {view === 'workbench'
          ? <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setView('library')}>{t('打开内容库', 'Open content library')} · {contents.length}</button>
          : <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setView('workbench')}>{t('返回工作台', 'Back to workbench')}</button>}
      </>}
    />

    <OpsTabs
      label={t('内容工作台视图', 'Content studio views')}
      value={view}
      onChange={id => setView(id as 'workbench' | 'library')}
      items={[
        { id: 'workbench', label: t('生成工作台', 'Workbench') },
        { id: 'library', label: t('内容库', 'Library'), count: contents.length },
      ]}
      panelId={id => `ops-studio-${id}`}
    />

    {(restored || body) && <div className="studio-draft-status" role="status">      <span>{draftStatus === 'unavailable'
        ? t('浏览器暂存不可用，请下载草稿以保留修改。', 'Browser draft storage is unavailable. Download a copy to keep your edits.')
        : saved ? t('内容已入库。', 'Content is in the library.')
          : t('草稿已自动暂存到此标签页，返回工作台可继续编辑。恢复后请重新审核。', 'Draft saved in this tab. Return to continue editing; review again before saving to the library.')}</span>
      <button className="ops-btn ops-btn-secondary ops-btn-sm" disabled={!body || busy || saving} onClick={() => stash()}>{t('暂存草稿', 'Save draft locally')}</button>
    </div>}

    {message && <OpsNotice error={failed}>{message}</OpsNotice>}

    {view === 'workbench' ? <div role="tabpanel" id="ops-studio-workbench" aria-labelledby="ops-studio-workbench-tab" className="ops-tabpanel">
      <ol className="studio-workflow" aria-label={t('内容工作流', 'Content workflow')}>
        <li>01 · {t('定义需求', 'Define needs')}</li>
        <li>02 · {t('生成与编辑', 'Generate and edit')}</li>
        <li>03 · {t('审核与保存', 'Review and save')}</li>
      </ol>

      <div className="ops-studio-grid">
        <section className="ops-card ops-studio-brief">
          <div className="ops-card-head"><h2>{t('01 · 内容需求', '01 · Content brief')}</h2></div>
          <fieldset disabled={busy || saving} className="studio-brief-grid">
            <label>{t('内容类型', 'Content type')}<select className="ops-select" value={inputs.task} onChange={e => change({ task: e.target.value as StudioInputs['task'] })}>
              <option value="itinerary">{t('住客体验行程', 'Guest itinerary')}</option>
              <option value="copy">{t('酒店推广文案', 'Hotel promotion')}</option>
            </select></label>
            <label>{t('目标客群', 'Target guests')}<select className="ops-select" value={inputs.audience} onChange={e => change({ audience: e.target.value as StudioInputs['audience'] })}>
              {Object.entries(AUDIENCES).map(([id, name]) => <option key={id} value={id}>{name[zh ? 0 : 1]}</option>)}
            </select></label>
            <label>{t('触达渠道', 'Channel')}<select className="ops-select" value={inputs.channel} onChange={e => change({ channel: e.target.value as StudioInputs['channel'] })}>
              {Object.entries(CHANNELS).map(([id, name]) => <option key={id} value={id}>{name[zh ? 0 : 1]}</option>)}
            </select></label>
            <label>{t('可用时长', 'Available time')}<select className="ops-select" value={inputs.minutes} onChange={e => change({ minutes: Number(e.target.value) })}>
              {[60, 90, 120, 180].map(n => <option key={n} value={n}>{n} {t('分钟', 'min')}</option>)}
            </select></label>
            <label className="studio-theme">{t('内容主题', 'Theme')}<input className="ops-input" maxLength={180} required value={inputs.theme} onChange={e => change({ theme: e.target.value })} /></label>
          </fieldset>
          <button type="button" className="ops-btn ops-btn-primary" disabled={busy || saving || !inputs.theme.trim()} onClick={() => void generate()}>
            {busy ? t('正在生成…', 'Generating…') : t(body ? '重新生成草稿' : '生成草稿', body ? 'Regenerate draft' : 'Generate draft')}
          </button>
        </section>

        <div className="ops-studio-main">
          {!body && <section className="ops-card">
            <OpsEmpty title={t('先定义需求，再生成草稿', 'Define the brief, then generate a draft')}>
              {t('生成后会在这里编辑正文，并在右侧完成审核。', 'The draft appears here for editing, with review on the right.')}
            </OpsEmpty>
          </section>}

          {body && <section className="ops-card">
            <div className="ops-card-head">
              <h2>{t('02 · 编辑内容', '02 · Edit content')}</h2>
              <span className="status-pill">{provider === 'deepseek' ? 'DeepSeek' : provider === 'template' ? t('内容模板', 'Content template') : t('已存内容', 'Saved content')} · {context?.language === 'zh' ? '中文' : 'English'}</span>
            </div>
            {stale && <OpsNotice>{t('需求参数已变更，请重新生成后再审核。当前正文保留。', 'Brief changed. Regenerate before review; the current text is retained.')}</OpsNotice>}
            <fieldset disabled={busy || saving}>
              <label className="ops-field">{t('内容标题', 'Content title')}<input className="ops-input" maxLength={200} value={title} onChange={e => { setTitle(e.target.value); invalidate() }} /></label>
              <label className="ops-field ops-body-label">{t('正文语言', 'Draft language')}<select className="ops-select" value={context?.language ?? language} onChange={e => {
                const actualLanguage = e.target.value as 'zh' | 'en'
                setContext(current => current ? { ...current, language: actualLanguage } : null)
                invalidate()
              }}><option value="zh">中文</option><option value="en">English</option></select></label>
              <label className="ops-field ops-body-label">{t('正文', 'Content')}<textarea className="ops-input studio-body-editor" maxLength={28000} value={body} onChange={e => { setBody(e.target.value); invalidate() }} /></label>
            </fieldset>
            <div className="ops-actions">
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => void copy()}>{t('复制正文', 'Copy content')}</button>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => downloadText(fileName + '.md', body.trim(), 'text/markdown;charset=utf-8')}>{t('下载 Markdown', 'Download Markdown')}</button>
              <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => printText(title, body.trim())}>{t('打印内容', 'Print content')}</button>
            </div>
          </section>}

          {body && <section className="ops-card">
            <div className="ops-card-head">
              <h2>{t('03 · 审核与保存', '03 · Review and save')}</h2>
              <span className="status-pill">{approved ? t('审核通过', 'Approved') : t('待审核', 'Review pending')}</span>
            </div>
            <fieldset disabled={busy || saving || stale}>
              {duration && !duration.valid && <OpsNotice error>{t(`请保留 4 个分段时长标题，合计应为 ${context?.minutes} 分钟（当前 ${duration.total} 分钟）。`, `Keep four timed section headings totalling ${context?.minutes} min (currently ${duration.total} min).`)}</OpsNotice>}
              <div className="studio-checks">
                {names.map((name, index) => <label key={index}>
                  <input type="checkbox" checked={checks[index]} onChange={e => { setChecks(current => current.map((value, i) => i === index ? e.target.checked : value)); setApproved(false) }} />
                  {name}
                </label>)}
              </div>
              <label className="ops-field">{t('审核意见', 'Review notes')}<textarea className="ops-input" value={notes} maxLength={1500} placeholder={t('填写本次核对结果与修改意见', 'Record the checks and changes you made')} onChange={e => { setNotes(e.target.value); setApproved(false) }} /></label>
              <div className="ops-actions">
                <button type="button" className="ops-btn ops-btn-secondary" disabled={!canApprove} onClick={() => { setSaveId(crypto.randomUUID()); setApproved(true) }}>{t('确认审核通过', 'Approve content')}</button>
                <button type="button" className="ops-btn ops-btn-primary" disabled={saving || saved || !approved || !canApprove} onClick={() => void save()}>{saving ? t('保存中…', 'Saving…') : t('保存到内容库', 'Save to content library')}</button>
              </div>
            </fieldset>
          </section>}
        </div>
      </div>
    </div> : <div role="tabpanel" id="ops-studio-library" aria-labelledby="ops-studio-library-tab" className="ops-tabpanel"><section className="ops-card" id="content-library">
      <div className="ops-card-head">
        <div>
          <h2>{t('内容库', 'Content library')} · {items.length}</h2>
          <p>{t('已审核保存的行程与推广文案。打开后会作为新草稿，原记录保留。', 'Reviewed itineraries and promotion copy. Opening one creates a new draft; the original record is kept.')}</p>
        </div>
        <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => void refresh().catch(e => { setFailed(true); setMessage(String(e.message)) })}>{t('刷新内容库', 'Refresh library')}</button>
      </div>
      <div className="studio-library-filters">
        <label className="ops-field">{t('搜索内容', 'Search content')}<input className="ops-input" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label className="ops-field">{t('类型', 'Type')}<select className="ops-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">{t('全部', 'All')}</option>
          <option value="itinerary">{t('行程', 'Itinerary')}</option>
          <option value="copy">{t('推广文案', 'Promotion')}</option>
        </select></label>
        <label className="ops-field">{t('正文语言', 'Content language')}<select className="ops-select" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
          <option value="all">{t('全部', 'All')}</option>
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select></label>
      </div>
      {!items.length && <OpsEmpty title={t('暂无符合条件的内容', 'No matching content')}>{t('完成审核后可保存第一份。', 'Review and save your first draft.')}</OpsEmpty>}
      {items.length > 0 && <div className="studio-library-list">
        {items.map(item => <article key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.language === 'en' ? 'English' : '中文'} · {new Date(item.createdAt).toLocaleString(zh ? 'zh-CN' : 'en-GB')} · {item.reviewStatus === 'approved' ? t('已审核', 'Approved') : t('已保存', 'Saved')}</p>
          <p>{decodeStudioContent(item.content).body.slice(0, 160)}</p>
          {item.auditNotes && <p>{t('审核意见：', 'Review: ')}{item.auditNotes}</p>}
          <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => open(item)}>{t('打开为新草稿', 'Open as a new draft')}</button>
        </article>)}
      </div>}
    </section></div>}
  </div>
}
