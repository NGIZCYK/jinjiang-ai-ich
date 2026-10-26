import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'
import { generateItinerary, generateMarketingCopy } from '../lib/llm'
import { useAppStore } from '../lib/store'
import { searchICH } from '../data/ichItems'

export function StudioPage() {
  const { language } = useLanguage()
  const addContent = useAppStore((s) => s.addContent)
  const contents = useAppStore((s) => s.contents)
  const user = useAppStore((s) => s.user)

  // 三步运营闭环：1: 定义任务 -> 2: 生成与编辑 -> 3: 核验、预览与发布
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [activeTask, setActiveTask] = useState<'itinerary' | 'copy'>('itinerary')

  // 步骤 1 参数
  const [prefer, setPrefer] = useState(language === 'zh' ? '90 分钟' : '90 minutes')
  const [scene, setScene] = useState(language === 'zh' ? '周末微度假' : 'Weekend escape')
  const [audience, setAudience] = useState(language === 'zh' ? '周末微度假住客' : 'Weekend escape guest')
  const [channel, setChannel] = useState(language === 'zh' ? '大堂礼宾屏' : 'Lobby concierge screen')

  // 步骤 2 内容
  const [itinerary, setItinerary] = useState('')
  const [marketingCopy, setMarketingCopy] = useState('')
  const [isEditingDraft, setIsEditingDraft] = useState(false)

  // 步骤 3 核验状态
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'revision'>('pending')
  const [auditNotes, setAuditNotes] = useState(
    language === 'zh'
      ? '请逐条核对作品出处、针法表述与服务可履约性；通过后填写审核意见。'
      : 'Review provenance, stitch descriptions and service feasibility item by item before approval.'
  )

  // 步骤 4 分发模式
  const [distMode, setDistMode] = useState<'letter' | 'signage'>('letter')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const copy = language === 'zh'
    ? {
        title: '苏绣内容策展台',
        lead: '把住客场景转成可生成、可核验、可分发的奢华酒店文化体验内容。',
        status: '三步受控工作流 · 人工核验后发布',
        steps: ['01 定义内容任务', '02 生成与编辑', '03 核验与发布'],
        task: '内容任务',
        input: '参数配置',
        guest: '目标客群',
        channel: '触达渠道',
        time: '可用停留时间',
        context: '传播情景',
        hint: '结合住客兴趣、触达渠道与可用时长，整理可编辑的体验内容。',
        itinerary: '住客体验行程',
        marketing: '酒店推广文案',
        generateItinerary: '生成苏绣微旅行建议',
        generateMarketing: '生成住中推广文案',
        itineraryLead: '根据停留时长（如90/120分钟）自动精确分段：赏析、识线、起针与回看。',
        marketingLead: '将苏绣工艺意境转为兼具文采与转化力的酒店多渠道营销草稿。',
        draft: '生成草稿并进入第 2 步',
        regenerate: '重新生成',
        aiDraft: '规则／模板草稿',
        empty: '尚未生成草稿',
        emptyLead: '请先在左侧设定住客与渠道参数，点击上方按钮开启生成。',
        saveHint: '保存后可在「我的行程」随时查阅与管理。',
        save: '确认并保存到「我的行程」',
        verification: '核验与发布',
        review: '合规复核',
        card: '知识库关联',
        connected: '已关联 · 待核验',
        marker: '核验状态',
        pending: '待人工确认',
        approved: '已审核通过',
        revision: '需补充考据',
        inventory: '工坊席位状态',
        inventoryVal: '体验时段预览',
        check: '发布前检查作品信息、工艺表述与体验安排。',
        recent: '近期保存记录',
        none: '生成并保存后，内容将在此陈列。',
        login: '请先登录后再保存到「我的行程」',
        generateFirst: '请先生成内容草稿',
        saved: '已成功保存至「我的行程」',
        print: '打印 / 导出信笺',
        audience: ['周末微度假住客', '亲子文化体验住客', '商务延住住客'],
        channels: ['客房欢迎信笺', '大堂立式电子水牌', '前台礼宾推荐卡', '手机端小程序推送'],
        times: ['60 分钟', '90 分钟', '120 分钟', '半日雅集 (180分钟)'],
      }
    : {
        title: 'Su Embroidery Content Studio',
        lead: 'Shape guest scenarios into generable, verifiable and distributable cultural content.',
        status: 'Three-step workflow · human review before release',
        steps: ['01 Define Brief', '02 Generate & Edit', '03 Review & Publish'],
        task: 'Curation Task',
        input: 'Parameters',
        guest: 'Target Guest',
        channel: 'Touchpoint Channel',
        time: 'Available Duration',
        context: 'Context & Theme',
        hint: 'Shape an editable experience draft around guest interests, touchpoints and available time.',
        itinerary: 'Guest Itinerary',
        marketing: 'Hotel Promotion',
        generateItinerary: 'Generate Su Embroidery Itinerary',
        generateMarketing: 'Generate Marketing Copy',
        itineraryLead: 'Dynamically partitions duration into appreciation, materials, stitching and reflection.',
        marketingLead: 'Turn craft heritage into high-conversion editorial copy for luxury hotel distribution.',
        draft: 'Generate Draft & Proceed to Step 2',
        regenerate: 'Regenerate Draft',
        aiDraft: 'RULE / TEMPLATE DRAFT',
        empty: 'No content generated yet',
        emptyLead: 'Configure guest parameters on the left and generate a tailored draft.',
        saveHint: 'Saved items can be managed in My Journey at any time.',
        save: 'Save to My Journey',
        verification: 'Review & Publish',
        review: 'Audit Review',
        card: 'Knowledge Base',
        connected: 'Linked · review pending',
        marker: 'Verification Status',
        pending: 'Pending Review',
        approved: 'Approved & Verified',
        revision: 'Needs Revision',
        inventory: 'Atelier Capacity',
        inventoryVal: 'Experience time preview',
        check: 'Before publication, check artwork information, craft descriptions and experience details.',
        recent: 'Recent Saves',
        none: 'Saved curation items will appear here.',
        login: 'Please sign in before saving to My Journey.',
        generateFirst: 'Please generate a draft first.',
        saved: 'Successfully saved to My Journey',
        print: 'Print / Export Letter',
        audience: ['Weekend escape guest', 'Family culture guest', 'Extended-stay business guest'],
        channels: ['In-Room Welcome Letter', 'Lobby Digital Signage', 'Front Desk Card', 'Mobile App Push'],
        times: ['60 minutes', '90 minutes', '120 minutes', 'Half-day salon (180 min)'],
      }

  useEffect(() => {
    setPrefer(language === 'zh' ? '90 分钟' : '90 minutes')
    setScene(language === 'zh' ? '周末微度假' : 'Weekend escape')
    setAudience(language === 'zh' ? '周末微度假住客' : 'Weekend escape guest')
    setChannel(language === 'zh' ? '大堂礼宾屏' : 'Lobby concierge screen')
    setItinerary('')
    setMarketingCopy('')
    setVerificationStatus('pending')
    setMsg('')
  }, [language])

  useEffect(() => {
    setVerificationStatus('pending')
    setMsg('')
    if ((activeTask === 'itinerary' ? itinerary : marketingCopy)) setCurrentStep(2)
    // Each content type requires its own review cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask])

  const localizedContents = contents.filter((content) => (content.language ?? 'zh') === language)
  const isItinerary = activeTask === 'itinerary'
  const activeOutput = isItinerary ? itinerary : marketingCopy
  const activeTitle = isItinerary
    ? (language === 'zh' ? `苏绣行程 · ${prefer} · ${audience}` : `Su Embroidery Itinerary · ${prefer} · ${audience}`)
    : (language === 'zh' ? `推广文案 · ${scene} · ${channel}` : `Promotion Copy · ${scene} · ${channel}`)

  function generateCurrent() {
    setMsg('')
    if (isItinerary) {
      const res = generateItinerary(prefer, language, { audience, channel })
      setItinerary(res)
    } else {
      const res = generateMarketingCopy(scene, language, { audience, channel })
      setMarketingCopy(res)
    }
    setVerificationStatus('pending')
    setCurrentStep(2)
  }

  async function onSave() {
    if (!user) {
      setMsg(copy.login)
      return
    }
    if (!activeOutput) {
      setMsg(copy.generateFirst)
      return
    }
    if (verificationStatus !== 'approved') {
      setMsg(language === 'zh' ? '请先完成人工核验并标记为“审核通过”' : 'Complete human review and approve the draft before saving.')
      setCurrentStep(3)
      return
    }
    if (!auditNotes.trim()) { setMsg(language === 'zh' ? '请填写审核意见' : 'Enter review notes.'); return }
    setSaving(true)
    try { await addContent(activeTask, activeTitle, activeOutput, language, auditNotes); setMsg(copy.saved) }
    catch (error) { setMsg(error instanceof Error ? error.message : 'Save failed') }
    finally { setSaving(false) }
  }

  // 关联合适的考据项
  const relevantHeritageItems = searchICH([isItinerary ? prefer : scene, audience, channel].join(' '), language, 4)

  return (
    <div className="ops-page studio-page">
      {/* 顶部策展标题 */}
      <div className="ops-masthead">
        <div>
          <p className="eyebrow">CONTENT CURATION & DISTRIBUTION WORKSPACE</p>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`ops-status ${verificationStatus === 'approved' ? 'is-approved' : ''}`}>
            {verificationStatus === 'approved' ? (language === 'zh' ? '✓ 已通过人工复核' : '✓ Human Verified') : copy.status}
          </span>
        </div>
      </div>

      {/* 步骤条（受控状态机） */}
      <ol className="studio-steps" aria-label={language === 'zh' ? '内容工作流程状态机' : 'Content workflow state machine'}>
        {copy.steps.map((step, index) => {
          const stepNum = (index + 1) as 1 | 2 | 3
          const isActive = currentStep === stepNum
          const isPassed = currentStep > stepNum
          return (
            <li
              key={step}
              onClick={() => {
                // 未生成内容前只开放任务定义；生成后可在编辑与核验发布间往返。
                if (stepNum === 1 || Boolean(activeOutput) || isPassed) {
                  setCurrentStep(stepNum)
                }
              }}
              className={`cursor-pointer transition-all ${
                isActive
                  ? 'studio-step-active font-medium'
                  : isPassed
                  ? 'bg-stone-100 text-stone-800 font-normal hover:bg-stone-200/80'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : isPassed ? 'bg-jade text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                {isPassed ? '✓' : `0${stepNum}`}
              </span>
              <span className="truncate">{step}</span>
            </li>
          )
        })}
      </ol>

      {/* 主工作区布局 */}
      <div className="studio-grid">
        {/* 左栏：参数配置 */}
        <aside className="card studio-task-panel h-fit p-5">
          <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 pb-3">
            <h2 className="font-semibold text-stone-800">{copy.task}</h2>
            <span className="text-xs text-stone-400">{copy.input}</span>
          </div>

          <div className="mt-4">
            <label className="studio-label">{language === 'zh' ? '内容任务类型' : 'Task Type'}</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-lg bg-stone-100 p-1">
              <button
                type="button"
                className={`rounded-md py-1.5 text-xs font-medium transition ${
                  isItinerary ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                onClick={() => setActiveTask('itinerary')}
              >
                {copy.itinerary}
              </button>
              <button
                type="button"
                className={`rounded-md py-1.5 text-xs font-medium transition ${
                  !isItinerary ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                onClick={() => setActiveTask('copy')}
              >
                {copy.marketing}
              </button>
            </div>
          </div>

          <label className="studio-label mt-4">{copy.guest}</label>
          <select className="input mt-1" value={audience} onChange={(e) => { setAudience(e.target.value); setVerificationStatus('pending'); setCurrentStep(1); setMsg('') }}>
            {copy.audience.map((item) => <option key={item}>{item}</option>)}
          </select>

          <label className="studio-label mt-4">{copy.channel}</label>
          <select className="input mt-1" value={channel} onChange={(e) => { setChannel(e.target.value); setVerificationStatus('pending'); setCurrentStep(1); setMsg('') }}>
            {copy.channels.map((item) => <option key={item}>{item}</option>)}
          </select>

          {isItinerary ? (
            <>
              <label className="studio-label mt-4">{copy.time}</label>
              <select className="input mt-1" value={prefer} onChange={(e) => { setPrefer(e.target.value); setVerificationStatus('pending'); setCurrentStep(1); setMsg('') }}>
                {copy.times.map((t) => <option key={t}>{t}</option>)}
              </select>
            </>
          ) : (
            <>
              <label className="studio-label mt-4">{copy.context}</label>
              <input className="input mt-1" value={scene} onChange={(e) => { setScene(e.target.value); setVerificationStatus('pending'); setCurrentStep(1); setMsg('') }} />
            </>
          )}

          <div className="mt-5 border-t border-stone-100 pt-4">
            <button
              type="button"
              className="btn-primary w-full py-2 text-xs font-medium"
              onClick={generateCurrent}
            >
              {activeOutput ? copy.regenerate : copy.draft}
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-stone-500">
            {copy.hint}
          </p>
        </aside>

        {/* 中栏：根据 currentStep 显示不同阶段界面 */}
        <section className="card studio-workspace overflow-hidden">
          {/* 步骤 1：定义场景提示 */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-jade-light text-base font-serif font-bold text-jade">
                  01
                </div>
                <h3 className="mt-3 text-base font-semibold text-stone-800">
                  {language === 'zh' ? '步骤 01：定义场景与受众触点' : 'Step 01: Define Scenario & Touchpoint'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-stone-600">
                  {language === 'zh'
                    ? '请在左侧侧边栏设置目标住客分层（如微度假、亲子）、分发触点（如客房信笺、水牌）以及停留时长。系统将基于非遗知识库动态分配工序与茶歇时间。'
                    : 'Configure guest segment, touchpoint and duration. The system builds an editable schedule for human review.'}
                </p>
                <div className="mt-6">
                  <button type="button" className="btn-primary" onClick={generateCurrent}>
                    {copy.draft}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 步骤 2：生成草稿与校阅 */}
          {currentStep === 2 && (
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Step 02</span>
                    <h2 className="font-semibold text-stone-900">{activeTitle}</h2>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {language === 'zh' ? '草稿已生成，各环节时长与输入严格闭环对齐。可直接编辑微调。' : 'Draft generated. Durations strictly aligned. Direct edit available.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost !py-1 !text-xs"
                    onClick={() => setIsEditingDraft(!isEditingDraft)}
                  >
                    {isEditingDraft ? (language === 'zh' ? '预览模式' : 'Preview') : (language === 'zh' ? '手动编辑' : 'Edit Text')}
                  </button>
                  <button type="button" className="btn-ghost !py-1 !text-xs" onClick={generateCurrent}>
                    {copy.regenerate}
                  </button>
                </div>
              </div>

              {activeOutput ? (
                <div className="mt-4 rounded-xl border border-stone-200 bg-[#fffdf9] p-4">
                  {isEditingDraft ? (
                    <textarea
                      rows={14}
                      className="input w-full font-sans text-xs leading-relaxed"
                      value={isItinerary ? itinerary : marketingCopy}
                      onChange={(e) => {
                        if (isItinerary) setItinerary(e.target.value)
                        else setMarketingCopy(e.target.value)
                        setVerificationStatus('pending')
                      }}
                    />
                  ) : (
                    <pre className="studio-output max-h-[30rem] font-sans text-xs leading-relaxed text-stone-700">
                      {activeOutput}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="studio-empty mt-4">
                  <div className="text-sm font-medium text-ink">{copy.empty}</div>
                  <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">{copy.emptyLead}</p>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setCurrentStep(1)}>
                  {language === 'zh' ? '← 返回修改参数' : '← Back to Step 1'}
                </button>
                <button
                  type="button"
                  className="btn-primary !py-1.5 !text-xs"
                  onClick={() => setCurrentStep(3)}
                  disabled={!activeOutput}
                >
                  {language === 'zh' ? '进入非遗来源核验 (Step 03) →' : 'Proceed to Verification (Step 03) →'}
                </button>
              </div>
            </div>
          )}

          {/* 步骤 3：来源核验与审核 */}
          {currentStep === 3 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Step 03</span>
                    <h2 className="font-semibold text-stone-900">{copy.verification}</h2>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {language === 'zh' ? '核对作品信息、技艺表述与体验安排，完成内容审核。' : 'Check artwork information, craft descriptions and experience details before approving the content.'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  verificationStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : verificationStatus === 'revision'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {verificationStatus === 'approved' ? copy.approved : verificationStatus === 'revision' ? copy.revision : copy.pending}
                </span>
              </div>

              {/* 考据词条匹配列表 */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {language === 'zh' ? '知识库锚定词条与出处' : 'Anchored Knowledge Base Items'}
                </h4>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                  {relevantHeritageItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-800">{language === 'zh' ? item.title : (item.titleEn ?? item.title)}</span>
                        <span className="rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] text-stone-600">{language === 'zh' ? item.tags[0] : 'Reference'}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-stone-500">{language === 'zh' ? item.summary : (item.summaryEn ?? item.summary)}</p>
                      <div className="mt-2 border-t border-stone-200/60 pt-1.5 text-[10px] text-stone-400">
                        {language === 'zh' ? `来源：${item.sources.join(' / ')}` : `Sources: ${(item.sourcesEn ?? item.sources).join(' / ')}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 审核清单 */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
                <h4 className="text-xs font-semibold text-amber-900">
                  {language === 'zh' ? '文化内容发布前核验清单' : 'Pre-publication Cultural Checklist'}
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-jade font-bold">✓</span>
                    <span>{language === 'zh' ? '作品信息：核对《姑苏繁华图》的名称、作者及数字演绎说明。' : 'Artwork information: check the scroll title, artist and digital interpretation.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-jade font-bold">✓</span>
                    <span>{language === 'zh' ? '技艺严谨：劈丝标准标明为镇湖工坊口传经验分级，不作绝对工业微米级承诺。' : 'Craft rigor: Thread splitting labeled as atelier artisan empirical grading.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-jade font-bold">✓</span>
                    <span>{language === 'zh' ? '体验安排：核对时段、容量、费用与参与流程。' : 'Experience details: check times, capacity, prices and the participation flow.'}</span>
                  </li>
                </ul>
              </div>

              {/* 审核操作栏 */}
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <label className="studio-label">{language === 'zh' ? '审核员复核签注意见' : 'Auditor Notes & Sign-off'}</label>
                <input
                  className="input mt-1.5 text-xs"
                  value={auditNotes}
                  onChange={(e) => { setAuditNotes(e.target.value); setVerificationStatus('pending') }}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVerificationStatus('approved')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        verificationStatus === 'approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {language === 'zh' ? '审核通过' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerificationStatus('revision')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        verificationStatus === 'revision'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {language === 'zh' ? '退回修订' : 'Require revision'}
                    </button>
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {language === 'zh' ? '审核人：锦江大堂礼宾文化审核员' : 'Reviewer: Jinjiang Cultural Concierge'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setCurrentStep(2)}>
                  {language === 'zh' ? '← 返回草稿修改' : '← Back to Draft'}
                </button>
                <span className={`studio-review-gate ${verificationStatus === 'approved' ? 'is-ready' : ''}`}>
                  {verificationStatus === 'approved'
                    ? (language === 'zh' ? '核验完成 · 分发预览已开放' : 'Review complete · distribution preview ready')
                    : (language === 'zh' ? '审核通过后将在下方开放分发预览' : 'Approve to unlock the distribution preview below')}
                </span>
              </div>
            </div>
          )}

          {/* 步骤 3 下半区：审核通过后保存与双模分发 */}
          {currentStep === 3 && verificationStatus === 'approved' && (
            <div className="studio-distribution p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Step 03 · Publish</span>
                    <h2 className="font-semibold text-stone-900">{language === 'zh' ? '住客触点分发预览' : 'Guest Touchpoint Preview'}</h2>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {language === 'zh' ? '可无缝切换「客房欢迎信笺」与「大堂立式电子水牌」分发形态。' : 'Toggle between In-Room Welcome Letter and Lobby Digital Signage mode.'}
                  </p>
                </div>
                {/* 模式切换器 */}
                <div className="flex items-center gap-1.5 rounded-lg bg-stone-100 p-1">
                  <button
                    type="button"
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      distMode === 'letter' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    onClick={() => setDistMode('letter')}
                  >
                    {language === 'zh' ? '客房欢迎信笺' : 'In-Room Letter'}
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      distMode === 'signage' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    onClick={() => setDistMode('signage')}
                  >
                    {language === 'zh' ? '大堂立式电子水牌' : 'Lobby Signage'}
                  </button>
                </div>
              </div>

              {/* 分发模式 A：客房欢迎信笺 */}
              {distMode === 'letter' && (
                <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/80 bg-[#fffdf8] p-7 shadow-lg relative print:m-0 print:border-none">
                  {/* 奢华信笺抬头 */}
                  <div className="border-b border-amber-200/60 pb-4 text-center">
                    <div className="text-[10px] tracking-[0.25em] text-amber-800 uppercase font-semibold">
                      JINJIANG HOTEL SUZHOU · CULTURAL CONCIERGE
                    </div>
                    <h3 className="mt-1 font-serif text-lg font-bold text-stone-900">
                      {language === 'zh' ? '苏州锦江 · 苏绣文化体验建议函' : 'Su Embroidery Experience Note · Jinjiang Suzhou'}
                    </h3>
                    <div className="mt-1 text-[11px] text-stone-500 font-serif">
                      {language === 'zh' ? '住客触点内容预览' : 'Guest touchpoint preview'}
                    </div>
                  </div>

                  {/* 信笺正文 */}
                  <div className="mt-5 space-y-3 font-serif text-xs leading-relaxed text-stone-700">
                    <p className="indent-6">
                      {language === 'zh'
                        ? '江南雨落，丝缕生辉。我们依照你的停留时长，整理了一份从观绣、识线到试针的文化体验建议。你可以从感兴趣的主题开始，逐步发现苏绣细节。'
                        : 'Silk catches the light in Jiangnan rain. Based on your available time, here is a cultural journey from observation to thread and first stitch. Begin with your interests and discover the details of Su embroidery.'}
                    </p>
                    <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-200/40 my-3 font-sans">
                      <div className="text-[11px] font-semibold text-amber-900 mb-1">
                        {activeTitle}
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-stone-700">
                        {activeOutput}
                      </pre>
                    </div>
                    <p className="indent-6 text-[11px] text-stone-500">
                      {language === 'zh'
                        ? '如需调整体验时长，请返回内容工作台修改参数并重新核验。'
                        : 'To adjust the duration, return to the studio, update the parameters and review again.'}
                    </p>
                  </div>

                  {/* 印鉴与落款 */}
                  <div className="mt-6 flex items-end justify-between border-t border-amber-200/60 pt-4">
                    <div className="text-[11px] text-stone-500">
                      <div>{language === 'zh' ? '审核编号：' : 'Approval Ref: '}JJ-CURATE-2026-0913</div>
                      <div>
                        {language === 'zh' ? '审核状态：' : 'Status: '}
                        {verificationStatus === 'approved'
                          ? (language === 'zh' ? '人工复核通过' : 'Human review approved')
                          : (language === 'zh' ? '待审核' : 'Review pending')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs font-serif text-stone-800">
                        <div>{language === 'zh' ? '锦江文化礼宾团队' : 'Jinjiang Concierge Team'}</div>
                        <div className="text-[10px] text-stone-400">谨呈</div>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-vermilion bg-vermilion-light text-[10px] font-bold text-vermilion font-serif shadow-xs">
                        {language === 'zh' ? '内容\n预览' : 'CONTENT\nDRAFT'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 分发模式 B：大堂立式电子水牌 */}
              {distMode === 'signage' && (
                <div className="mx-auto max-w-sm rounded-3xl border-8 border-stone-800 bg-[#161412] p-5 text-white shadow-2xl">
                  <div className="text-center">
                    <span className="inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300">
                      TODAY AT JINJIANG
                    </span>
                    <h3 className="mt-2 font-serif text-base font-semibold tracking-wide text-amber-100">
                      {language === 'zh' ? '大堂非遗艺术工坊 · 今日雅集' : 'Heritage Atelier · Daily Sessions'}
                    </h3>
                    <p className="mt-1 text-[11px] text-stone-400">
                      {language === 'zh' ? '清·徐扬《姑苏繁华图》设色画底本数字演绎' : 'Prosperous Suzhou Scroll Interpretation'}
                    </p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-stone-700">
                    <img
                      src="/assets/suxiu-gusu-prosperous.webp"
                      alt="姑苏繁华图"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl bg-stone-900/90 p-3 text-xs">
                    <div className="flex justify-between border-b border-stone-800 pb-2">
                      <span className="text-stone-400">{language === 'zh' ? '开放场次' : 'Daily Slots'}</span>
                      <span className="font-semibold text-amber-200">10:30 / 14:00 / 16:30</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-2">
                      <span className="text-stone-400">{language === 'zh' ? '体验状态' : 'Experience Status'}</span>
                      <span className="font-semibold text-amber-200">{language === 'zh' ? '可记录体验意向' : 'Record experience interest'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">{language === 'zh' ? '席位限制' : 'Capacity'}</span>
                      <span className="text-stone-300">{language === 'zh' ? '容量未定 · 可记录意向' : 'Capacity TBD · preference only'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-950/40 p-3 border border-amber-900/60">
                    <div className="text-[11px] text-amber-200">
                      <div>{language === 'zh' ? '扫码直通预约通道' : 'Scan to Reserve Atelier'}</div>
                      <div className="text-[9px] text-amber-400/80">{language === 'zh' ? '或联系大堂副理预留' : 'or inquire with Concierge'}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-[9px] font-bold text-black">
                      QR CODE
                    </div>
                  </div>
                </div>
              )}

              {/* 底部保存与打印操作 */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setCurrentStep(3)}>
                    {language === 'zh' ? '← 返回核验' : '← Back to Verification'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !py-1.5 !text-xs"
                    onClick={() => window.print()}
                  >
                    {copy.print}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-500">{copy.saveHint}</span>
                  <button
                    type="button"
                    className="btn-primary !py-2 !text-xs font-semibold"
                    disabled={saving}
                    onClick={() => void onSave()}
                  >
                    {copy.save}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 右栏：审核合规与近期保存 */}
         <aside className="studio-side-rail space-y-4">
          <div className="card p-5">
            <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 pb-3">
              <h2 className="font-semibold text-stone-800">{copy.verification}</h2>
              <span className="text-xs text-stone-400">{copy.review}</span>
            </div>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-stone-600">{copy.card}</span>
                <span className="text-jade font-medium">{copy.connected}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-stone-600">{copy.marker}</span>
                <span className={`font-medium ${
                  verificationStatus === 'approved' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {verificationStatus === 'approved' ? copy.approved : activeOutput ? copy.pending : copy.pending}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-stone-600">{copy.inventory}</span>
                <span className="text-stone-700">{copy.inventoryVal}</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 text-[11px] leading-5 text-amber-900">
              {copy.check}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 pb-3">
              <h2 className="font-semibold text-stone-800">{copy.recent}</h2>
              <span className="text-xs text-stone-500">{localizedContents.length} {language === 'zh' ? '条' : 'items'}</span>
            </div>
            {localizedContents.length === 0 ? (
              <p className="mt-3 text-xs leading-5 text-stone-500">{copy.none}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {localizedContents.slice(0, 3).map((content) => (
                  <li key={content.id} className="rounded-lg bg-stone-50 p-2.5">
                    <div className="text-xs font-medium text-stone-800">{content.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-stone-500">
                      <span>{content.type === 'itinerary' ? copy.itinerary : copy.marketing}</span>
                      <Link to="/my" className="text-jade hover:underline">{language === 'zh' ? '去我的行程查看' : 'View in My Journey'}</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{msg}</span>
          <Link to="/my" className="underline underline-offset-2 hover:text-emerald-950">
            {language === 'zh' ? '立即前往「我的行程」查看 →' : 'View in My Journey →'}
          </Link>
        </div>
      )}
    </div>
  )
}
