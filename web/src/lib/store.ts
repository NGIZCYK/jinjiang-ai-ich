import { clearContinuation } from './journeyFlow'
import { create } from 'zustand'
import type { ChatMessage, GeneratedContent, GuideSignal, User } from '../types'
import { cloud, requireCloud, rpc } from './cloud'
import { loadGuideSignals, persistGuideSignals } from './guideSignalStorage'
import type { Language } from './i18n'
interface AppState {
 user: User | null; ready: boolean; authError: string; batch: string;
 messages: ChatMessage[]; guideSignals: GuideSignal[]; contents: GeneratedContent[];
 login: (email:string,password:string,language?:Language) => Promise<{ok:boolean;error?:string}>;
 register: (email:string,password:string,name:string,language?:Language) => Promise<{ok:boolean;error?:string;confirmation?:boolean}>;
 logout: () => Promise<void>; initialize: () => void; refreshContents: () => Promise<void>;
 addMessage: (m:Omit<ChatMessage,'id'|'createdAt'>) => ChatMessage;
 addGuideSignal: (s:Omit<GuideSignal,'id'|'createdAt'>) => Promise<void>;
 clearMessages: (language?:Language) => void; clearGuideSignals: (language?:Language) => void;
 addContent: (type:GeneratedContent['type'],title:string,content:string,language:Language,notes:string) => Promise<void>;
}
let started = false
let authVersion = 0
let authEventVersion = 0
let pendingIdentity: { id?: string; promise: Promise<void> } | null = null
function loadIdentity(id?: string) {
 if (id && useAppStore.getState().ready && useAppStore.getState().user?.id === id) return Promise.resolve()
 if (pendingIdentity && pendingIdentity.id === id) return pendingIdentity.promise
 const pending = { id, promise: Promise.resolve() }
 pendingIdentity = pending
 pending.promise = (async () => {
 const version = ++authVersion
 useAppStore.setState({ user:null, ready:false, batch:'demo', messages:[], guideSignals:loadGuideSignals(),contents:[],authError:'' })
 if (!id || !cloud) { useAppStore.setState({ ready:true }); return }
 const {data,error} = await cloud.from('profiles').select('*').eq('id',id).single()
 if (version !== authVersion) return
 if (error) { useAppStore.setState({ready:true,authError:error.message}); return }
 const {data:session} = await cloud.auth.getSession()
 if (version !== authVersion) return
 useAppStore.setState({ ready:true, batch:data.batch_id, user:{ id:data.id,name:data.name,role:data.role,email:session.session?.user.email || '' } })
 if (data.role==='ops') void useAppStore.getState().refreshContents().catch(() => {})
 })().catch(error => {
  if (pendingIdentity === pending) useAppStore.setState({user:null,ready:true,authError:error instanceof Error ? error.message : String(error)})
 }).finally(() => { if (pendingIdentity === pending) pendingIdentity = null })
 return pending.promise
}
export const useAppStore = create<AppState>((set,get) => ({
 user:null,ready:!cloud,authError:'',batch:'demo',messages:[],guideSignals:loadGuideSignals(),contents:[],
 initialize() {
  if(started || !cloud) return; started=true
  const initialVersion = authEventVersion
  void cloud.auth.getSession().then(({data}) => {
   if (initialVersion === authEventVersion) void loadIdentity(data.session?.user.id)
  }).catch(error => {
   if (initialVersion === authEventVersion) set({ready:true,authError:String(error)})
  })
  cloud.auth.onAuthStateChange((event,session) => {
   if (event === 'TOKEN_REFRESHED' || (session?.user.id === get().user?.id && event === 'SIGNED_IN')) return
   const version = ++authEventVersion
   setTimeout(() => { if (version === authEventVersion) void loadIdentity(session?.user.id) },0)
  })
 },
 async login(email,password) {
  ++authEventVersion
  try { const {data,error}=await requireCloud().auth.signInWithPassword({email:email.trim(),password}); if(error) throw error; await loadIdentity(data.user.id); if(get().authError) throw new Error(get().authError); return {ok:true} }
  catch(e) { return {ok:false,error:e instanceof Error?e.message:String(e)} }
 },
 async register(email,password,name) {
  ++authEventVersion
  try { const {data,error}=await requireCloud().auth.signUp({email:email.trim(),password,options:{data:{name}}}); if(error) throw error; if(data.session) await loadIdentity(data.user?.id); return {ok:true,confirmation:!data.session} }
  catch(e) {return {ok:false,error:e instanceof Error?e.message:String(e)}}
 },
 async logout() {
  ++authEventVersion
  await loadIdentity()
  persistGuideSignals([]);set({guideSignals:[]});clearContinuation()
  try { sessionStorage.removeItem('jj_v2_needs');sessionStorage.removeItem('jj_v2_exploration_draft') } catch { /* Storage may be unavailable. */ }
  try { if(cloud) {const {error}=await cloud.auth.signOut({scope:'local'});if(error) set({authError:error.message})} }
  catch(error) {set({authError:error instanceof Error ? error.message : String(error)})}
 },
 addMessage(m) {const full={...m,id:crypto.randomUUID(),createdAt:Date.now()};set({messages:[...get().messages,full]});return full},
 async addGuideSignal(s) {
  const owner=get().user?.id
  if(get().user?.role==='guest')await rpc('save_guide_signal',{p_request:s.sourceMessageId,p_language:s.language,p_topics:s.topics,p_stay_hours:s.stayHours??null,p_budget:s.budget??null,p_party_type:s.partyType,p_sentiment:s.sentiment})
  if(owner!==get().user?.id)return
  const next=[{...s,id:crypto.randomUUID(),createdAt:Date.now()},...get().guideSignals].slice(0,200);persistGuideSignals(next);set({guideSignals:next})
 },
 clearMessages(l) {set({messages:l?get().messages.filter(m=>(m.language??'zh')!==l):[]})},
 clearGuideSignals(l) {const next=l?get().guideSignals.filter(s=>s.language!==l):[];persistGuideSignals(next);set({guideSignals:next})},
 async refreshContents() {
  const id=get().user?.id; if(!id || get().user?.role!=='ops') return
  const {data,error}=await requireCloud().from('reviewed_contents').select('*').order('created_at',{ascending:false})
  if(error) throw error
  if(id!==get().user?.id) return
  set({contents:data.map(c=>({id:c.id,userId:c.user_id,type:c.type,title:c.title,content:c.content,language:c.language,reviewStatus:c.review_status,auditNotes:c.audit_notes,reviewerId:c.reviewer_id,createdAt:new Date(c.created_at).getTime()}))})
 },
 async addContent(type,title,content,language,notes) {
  await rpc('save_reviewed_content',{p_type:type,p_title:title,p_content:content,p_language:language,p_notes:notes})
  await get().refreshContents()
 },
}))
