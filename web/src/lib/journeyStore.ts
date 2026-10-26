import { create } from 'zustand'
import { cloud, requireCloud, rpc } from './cloud'
import { CATALOG, EMPTY_EXPLORATION, type Exploration, type Experience, type SessionSlot, type SavedRecommendation, type JourneyBooking, type Needs } from './journey'
import { useAppStore } from './store'
interface JourneyState {
 owner: string|null; exploration: Exploration|null; recommendations: SavedRecommendation[]; bookings: JourneyBooking[];
 catalog: Experience[]; sessions: SessionSlot[]; needs: Needs|null; loading:boolean; error:string;
 refresh: () => Promise<void>; reset: () => void; saveExploration:(body:Exploration)=>Promise<void>;
}
let refreshVersion=0
export const useJourneyStore=create<JourneyState>((set,get)=>({
 owner:null,exploration:null,recommendations:[],bookings:[],catalog:CATALOG,sessions:[],needs:null,loading:false,error:'',
 reset(){refreshVersion++;set({owner:null,exploration:null,recommendations:[],bookings:[],sessions:[],needs:null,loading:false,error:''})},
 async refresh(){
  const id=useAppStore.getState().user?.id; if(!id || !cloud)return
  const version=++refreshVersion
  set({loading:true,error:''})
  try {
   const results=await Promise.all([
    cloud.from('explorations').select('body').eq('user_id',id).maybeSingle(),
    cloud.from('preferences').select('needs').eq('user_id',id).maybeSingle(),
    cloud.from('recommendations').select('*').eq('user_id',id).order('created_at',{ascending:false}),
    cloud.from('bookings').select('*,sessions(starts_at,experience_id),feedback(rating,comment)').order('created_at',{ascending:false}),
    cloud.from('experiences').select('*').eq('active',true),
    cloud.rpc('available_sessions'),
   ])
   const failure=results.find(r=>r.error); if(failure?.error)throw failure.error
   if(version!==refreshVersion || id!==useAppStore.getState().user?.id)return
   set({owner:id,exploration:(results[0].data as {body:Exploration}|null)?.body??null,needs:(results[1].data as {needs:Needs}|null)?.needs??null,recommendations:results[2].data as SavedRecommendation[],bookings:results[3].data as unknown as JourneyBooking[],catalog:results[4].data as Experience[],sessions:results[5].data as SessionSlot[],loading:false})
  }catch(e){if(version===refreshVersion)set({loading:false,error:e instanceof Error?e.message:String((e as {message?:string}).message??e)})}
 },
 async saveExploration(body){await rpc('save_exploration',{p_body:body});set({exploration:body,owner:useAppStore.getState().user?.id??null});await get().refresh()},
}))
const DRAFT='jj_v2_exploration_draft'
function storedDraft():Exploration|null {
 try { const x=JSON.parse(sessionStorage.getItem(DRAFT)||'null'); if(x&&typeof x.motif==='string'&&typeof x.palette==='string'&&Array.isArray(x.levels)&&x.levels.every((level:unknown)=>typeof level==='string')&&typeof x.answer==='string')return x }catch{}
 return null
}
export function hasDraft(){return storedDraft()!==null}
export function readDraft():Exploration{return storedDraft()??{...EMPTY_EXPLORATION,levels:[]}}
export function writeDraft(x:Exploration){try{sessionStorage.setItem(DRAFT,JSON.stringify(x))}catch{}}
export function clearDraft(){sessionStorage.removeItem(DRAFT)}
export async function loadPublicCatalog(){if(!cloud)return; const {data,error}=await requireCloud().from('experiences').select('*').eq('active',true);if(!error&&data)useJourneyStore.setState({catalog:data})}
