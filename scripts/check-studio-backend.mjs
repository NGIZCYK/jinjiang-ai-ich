// Explicit QA acceptance. Uses only the owned test manifest, never prints secrets or draft bodies.
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ROOT, QA_MANIFEST, validateManifest } from './qa-management.mjs'
import { DEMO_BACKEND, LIVE_SITE } from './check-live-site.mjs'
import { parseStudioDraft, studioMarkdown, encodeStudioContent, decodeStudioContent } from '../supabase/functions/_shared/studio.ts'
const { createClient }=createRequire(resolve(ROOT,'web/package.json'))('@supabase/supabase-js')
const env=Object.fromEntries((await readFile(resolve(ROOT,'web/.env.demo'),'utf8')).split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}))
if(env.VITE_SUPABASE_URL!==DEMO_BACKEND)throw Error('TARGET_MISMATCH')
const manifest=JSON.parse(await readFile(QA_MANIFEST,'utf8'));validateManifest(manifest)
const actors=[];const checks=[]
const assert=(condition,code)=>{if(!condition)throw Error(code)}
async function call(actor,input){return fetch(`${DEMO_BACKEND}/functions/v1/concierge/studio/generate`,{method:'POST',headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY,Origin:LIVE_SITE,Authorization:`Bearer ${actor.token}`,'Content-Type':'application/json'},body:JSON.stringify({input}),signal:AbortSignal.timeout(55000)})}
try{
 for(const account of manifest.accounts){const client=createClient(DEMO_BACKEND,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.auth.signInWithPassword({email:account.email,password:account.password});assert(!error&&data.user?.id===account.id,'QA_AUTH');actors.push({...account,client,token:data.session.access_token})}
 const [a,b,ops]=actors
 const base={task:'itinerary',audience:'culture',channel:'signage',minutes:90,theme:'长卷与丝线',language:'zh'}
 for(const guest of [a,b])assert((await call(guest,base)).status===403,'GUEST_ACCESS')
 checks.push({name:'studio_guest_access_denied',passed:true,guests:2})
 let original=''
 for(const input of [base,{...base,audience:'business',minutes:120,language:'en',theme:'Suzhou silk and city stories'},{...base,task:'copy',audience:'family',channel:'letter'},{...base,task:'copy',audience:'leisure',channel:'mobile',language:'en',theme:'Discover Suzhou through silk'}]){
  const response=await call(ops,input);const value=await response.json()
  if(response.status!==200)checks.push({name:'output_validation',status:response.status,code:value.code,validation:value.validation})
  assert(response.status===200,'STUDIO_HTTP_'+response.status)
  const draft=parseStudioDraft(value.draft,input)
  assert(value.provider==='deepseek'&&draft,'STUDIO_CONTRACT')
  if(input.language==='en')assert(/[a-z]{4}/i.test(draft.intro),'STUDIO_LANGUAGE')
  const body=studioMarkdown(draft);if(!original)original=encodeStudioContent(body,input,draft.provider)
  checks.push({name:'online_studio',task:input.task,audience:input.audience,channel:input.channel,minutes:input.minutes,language:input.language,passed:true,provider:value.provider,total:draft.segments.reduce((n,s)=>n+s.minutes,0),copyLength:draft.copyText.length})
 }
 const saved=[]
 for(const [suffix,content] of [['original',original],['edited',original.replace('# ','# Edited ')]] ){
  const {data:id,error}=await ops.client.rpc('save_reviewed_content',{p_type:'itinerary',p_title:`QA ${manifest.runId} ${suffix}`,p_content:content,p_language:'zh',p_notes:'QA check: trusted references and exact duration validated.'})
  assert(!error&&id,'SAVE_FAILED');saved.push({id,content})
 }
 assert(saved[0].id!==saved[1].id,'ORIGINAL_OVERWRITTEN')
 for(const row of saved){const {data,error}=await ops.client.from('reviewed_contents').select('content,language,audit_notes').eq('id',row.id).single();assert(!error&&data.content===row.content&&data.language==='zh'&&decodeStudioContent(data.content).inputs.minutes===90,'REOPEN_MISMATCH')}
 checks.push({name:'content_saved_reopened_and_original_preserved',passed:true,records:2})
 for(const guest of [a,b]){const {data,error}=await guest.client.from('reviewed_contents').select('id').in('id',saved.map(r=>r.id));assert(!error&&data.length===0,'LIBRARY_ACCESS_LEAK')}
 checks.push({name:'content_hidden_from_guests',passed:true})
}catch(error){checks.push({name:'studio_acceptance',passed:false,code:/^[A-Z_0-9]+$/.test(error.message)?error.message:'REQUEST_OR_ASSERTION_FAILED'});process.exitCode=1}
finally{for(const actor of actors)await actor.client.auth.signOut({scope:'local'});const report={checkedAt:new Date().toISOString(),passed:checks.length>0&&checks.every(c=>c.passed),checks};await writeFile(resolve(ROOT,'.cache/migration/studio-backend-20261028.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))}
