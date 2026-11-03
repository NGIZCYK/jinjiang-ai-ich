import { readFileSync,mkdirSync,writeFileSync } from 'node:fs'
import { dirname,resolve,join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),base='http://127.0.0.1:54329'
const env=readFileSync(join(root,'web/.env.demo'),'utf8'),value=name=>env.match(new RegExp(`^${name}=(.*)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const checks=[]
const require=createRequire(join(root,'web/package.json'))
const {createClient}=require('@supabase/supabase-js')
const sdk=createClient(base,'local-demonstration-anon',{auth:{persistSession:false,autoRefreshToken:false}})
const inventoryBefore=[];const concurrencyOrders=[]
function check(name,condition){assert.ok(condition,name);checks.push(name)}
async function call(path,data,token){const response=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5184',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});const result=await response.json();if(!response.ok)throw new Error(result.message||result.error_description||'HTTP '+response.status);return result}
const rpc=(name,args,token)=>call('/rest/v1/rpc/'+name,args,token)
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
function day(n){const date=new Date(today+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10)}
let ops,guest,other,order,second
try{
 check('local_backend_identity',(await call('/health')).service==='jinjiang-stays-local')
 const frontend=await fetch('http://127.0.0.1:5184/__project_identity').then(r=>r.json());check('isolated_stays_frontend',frontend.mode==='stays'&&frontend.root===join(root,'web'))
 const source=await fetch('http://127.0.0.1:5184/src/lib/cloud.ts').then(r=>r.text());check('frontend_uses_loopback_backend',source.includes('http://127.0.0.1:54329'))
 ops=await call('/auth/v1/token?grant_type=password',{email:value('VITE_DEMO_OPS_EMAIL'),password:value('VITE_DEMO_OPS_PASSWORD')})
 const suffix=randomUUID();const password=randomUUID()
 guest=await call('/auth/v1/signup',{email:`stay-qa-${suffix}@example.test`,password,data:{name:'Local QA guest'}})
 other=await call('/auth/v1/signup',{email:`stay-qa-other-${suffix}@example.test`,password,data:{name:'Local QA other'}})
 check('guest_and_operations_sign_in',!!guest.access_token&&!!ops.access_token)
 const sdkLogin=await sdk.auth.signInWithPassword({email:guest.user.email,password});check('supabase_sdk_auth_compatibility',!sdkLogin.error&&sdkLogin.data.user.id===guest.user.id)
 const args={p_room:'classic',p_plan:'heritage',p_in:day(50),p_out:day(52),p_guests:2}
 const quote=await rpc('quote_stay',args);check('nightly_quote_and_once_per_stay_package',quote.nights.length===2&&quote.total===quote.room_total+18000)
 for(const night of [day(50),day(51)]){const previous=(await call(`/rest/v1/stay_inventory?room_id=eq.classic&night=eq.${night}`,undefined,ops.access_token))[0];inventoryBefore.push(previous);await rpc('set_stay_inventory',{p_room:'classic',p_night:night,p_price:previous.price,p_capacity:1},ops.access_token)}
 order=await rpc('submit_stay_request',{...args,p_token:quote.token,p_request:randomUUID()},guest.access_token)
 second=await rpc('submit_stay_request',{...args,p_token:quote.token,p_request:randomUUID()},other.access_token)
 check('guest_receipt_saved',typeof order==='string')
 check('second_guest_cannot_read_order',(await call('/rest/v1/stay_bookings?select=*&id=eq.'+order,undefined,other.access_token)).length===0)
 check('operations_can_read_order',(await call('/rest/v1/stay_bookings?select=*&id=eq.'+order,undefined,ops.access_token)).length===1)
 const options=await rpc('stay_session_options',{p_booking:order},ops.access_token);check('operator_has_guarantee_options',options.some(s=>s.available>=2))
 const slot=options.find(s=>s.available>=2)
 await rpc('transition_stay_booking',{p_id:order,p_status:'confirmed',p_session:slot.id},ops.access_token)
 let rejected=false;try{await rpc('transition_stay_booking',{p_id:second,p_status:'confirmed'},ops.access_token)}catch(e){rejected=e.message.includes('STAY_SOLD_OUT')}
 check('last_room_cannot_be_confirmed_twice',rejected)
 const own=(await call('/rest/v1/stay_bookings?select=*,stay_entitlements(*)&id=eq.'+order,undefined,guest.access_token))[0]
 check('confirmed_order_has_held_package',own.status==='confirmed'&&own.stay_entitlements.status==='held')
 const sdkOrder=await sdk.from('stay_bookings').select('*,stay_entitlements(*)').eq('id',order).single();check('supabase_sdk_nested_order_and_date_compatibility',!sdkOrder.error&&sdkOrder.data.check_in===day(50)&&sdkOrder.data.stay_entitlements.status==='held')
 const before=(await rpc('available_sessions',{},guest.access_token)).find(s=>s.id===slot.id).available
 const activity=await rpc('redeem_stay_entitlement',{p_booking:order,p_session:slot.id},guest.access_token)
 const after=(await rpc('available_sessions',{},guest.access_token)).find(s=>s.id===slot.id).available
 check('redeeming_does_not_double_count_capacity',before===after)
 const booking=(await call('/rest/v1/bookings?select=*,sessions(*),feedback(*)&id=eq.'+activity,undefined,guest.access_token))[0]
 check('package_activity_is_confirmed_and_linked',booking.status==='confirmed'&&!!booking.stay_entitlement_id&&booking.sessions.experience_id==='workshop')
 check('guest_cannot_change_room_inventory',await rpc('set_stay_inventory',{p_room:'classic',p_night:day(50),p_price:0,p_capacity:100},guest.access_token).then(()=>false,()=>true))
 await rpc('transition_stay_booking',{p_id:order,p_status:'cancelled'},guest.access_token)
 const cancelled=(await call('/rest/v1/bookings?select=*&id=eq.'+activity,undefined,guest.access_token))[0]
 check('cancellation_releases_linked_activity',cancelled.status==='cancelled')
 check('cancellation_releases_room',(await rpc('quote_stay',args)).available===1)
 const raceArgs={p_room:'suite',p_plan:'room_only',p_in:day(60),p_out:day(61),p_guests:2}
 const previous=(await call(`/rest/v1/stay_inventory?room_id=eq.suite&night=eq.${day(60)}`,undefined,ops.access_token))[0];inventoryBefore.push(previous)
 await rpc('set_stay_inventory',{p_room:'suite',p_night:day(60),p_price:previous.price,p_capacity:1},ops.access_token)
 for(const account of [guest,other]){const q=await rpc('quote_stay',raceArgs);const id=await rpc('submit_stay_request',{...raceArgs,p_token:q.token,p_request:randomUUID()},account.access_token);concurrencyOrders.push({id,token:account.access_token})}
 const race=await Promise.allSettled(concurrencyOrders.map(o=>rpc('transition_stay_booking',{p_id:o.id,p_status:'confirmed'},ops.access_token)))
 check('concurrent_confirmations_do_not_oversell',race.filter(r=>r.status==='fulfilled').length===1&&race.filter(r=>r.status==='rejected'&&r.reason.message.includes('STAY_SOLD_OUT')).length===1)
 const c=await fetch(base+'/rest/v1/stay_rooms',{headers:{Origin:'https://untrusted.example'}});check('untrusted_origins_are_blocked',c.status===403)
 const output={version:'2026.11.02-stays-v1',timestamp:new Date().toISOString(),passed:checks.length,checks,cloudWrites:false,realBrowserVerified:false}
 mkdirSync(join(root,'.cache/stays-20261102'),{recursive:true});writeFileSync(join(root,'.cache/stays-20261102/local-http-results.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2))
}finally{
 if(guest&&order)await rpc('transition_stay_booking',{p_id:order,p_status:'cancelled'},guest.access_token).catch(()=>{})
 if(other&&second)await rpc('transition_stay_booking',{p_id:second,p_status:'cancelled'},other.access_token).catch(()=>{})
 for(const order of concurrencyOrders)await rpc('transition_stay_booking',{p_id:order.id,p_status:'cancelled'},order.token).catch(()=>{})
 if(ops)for(const row of inventoryBefore)await rpc('set_stay_inventory',{p_room:row.room_id,p_night:row.night,p_price:row.price,p_capacity:row.capacity},ops.access_token).catch(()=>{})
 await sdk.auth.signOut()
}
