import { beforeAll,beforeEach,afterAll,describe,it,expect } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
const guest='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222', ops='33333333-3333-4333-8333-333333333333', demo='44444444-4444-4444-8444-444444444444'
const session='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
let db:PGlite
const request=()=>crypto.randomUUID()
async function as<T=Record<string,unknown>>(id:string,sql:string,params:unknown[]=[]){await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${id}',false)`);try{return (await db.query<T>(sql,params)).rows}finally{await db.exec('reset role')}}
async function submit(id=guest,size=1,key=request()){return (await as<{id:string}>(id,'select submit_intention($1,$2,$3) id',[session,size,key]))[0].id}
async function signal(id=guest,key=request(),topics=['craft']){return (await as<{id:string}>(id,"select save_guide_signal($1,'zh',$2,2,150,'family','positive') id",[key,topics]))[0].id}
const exploration={motif:'boats',palette:'jade',levels:['full','1/4'],answer:'relative'}
beforeAll(async()=>{
 db=new PGlite()
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
 for(const name of readdirSync(new URL('../../supabase/migrations/',import.meta.url)).filter(name=>name.endsWith('.sql')).sort())await db.exec(readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'))
})
beforeEach(async()=>{
 await db.exec('truncate profiles cascade; truncate sessions cascade;')
 await db.exec('delete from auth.users')
 for(const id of [guest,other,ops,demo])await db.query("insert into auth.users values($1,$2)",[id,JSON.stringify({name:'Test',batch_id:'pilot-01',role:'ops'})])
 await db.query("update profiles set role='ops' where id=$1",[ops])
 await as(ops,"select assign_guest_batch($1,'pilot-01')",[guest])
 await as(ops,"select assign_guest_batch($1,'pilot-01')",[other])
 await db.query("insert into sessions(id,experience_id,starts_at,capacity) values($1,'workshop',now()+interval '2 days',2)",[session])
})
afterAll(async()=>{await db.close()})
describe('PostgreSQL journey, authorization and state invariants',()=>{
 it('accepts new floral themes and retains legacy card meaning without changing permissions',async()=>{
  for(const motif of ['gate','bridge','boats','market','huayun-pink-petal','huayun-white-petal','huayun-stamen','huayun-ground']){
   await as(guest,'select save_exploration($1)',[{...exploration,motif}])
   const rows=await as<{body:{motif:string};completed:boolean}>(guest,'select body,completed from explorations')
   expect(rows[0].body.motif).toBe(motif);expect(rows[0].completed).toBe(true)
  }
  await expect(as(guest,'select save_exploration($1)',[{...exploration,motif:'unknown-flower'}])).rejects.toThrow('INVALID_EXPLORATION')
  expect(await as(other,'select * from explorations')).toHaveLength(0)
  expect(await as(ops,'select * from explorations')).toHaveLength(0)
 })
 it('summarizes the whole cohort independently of the latest 50 feedback details',async()=>{
  for(let n=0;n<51;n++){
   const slot=crypto.randomUUID();await db.query("insert into sessions(id,experience_id,starts_at,capacity) values($1,'scroll',now()+($2||' days')::interval,2)",[slot,String(n+4)])
   const booking=(await db.query<{id:string}>("insert into bookings(user_id,session_id,party_size,status,batch_id,request_id) values($1,$2,1,'completed','pilot-01',$3) returning id",[guest,slot,request()])).rows[0].id
   await db.query("insert into feedback values($1,$2,$3,'feedback',now()+($4||' seconds')::interval)",[booking,guest,n===0?1:5,String(n)])
  }
  const stats=(await as<{data:{feedback:unknown[];feedbackSummary:{count:number;averageRating:number}}}>(ops,"select trial_analytics('pilot-01') data"))[0].data
  expect(stats.feedback).toHaveLength(50);expect(stats.feedbackSummary.count).toBe(51)
  expect(stats.feedbackSummary.averageRating).toBeCloseTo(251/51)
  const empty=(await as<{data:{feedbackSummary:{count:number;averageRating:null}}}>(ops,"select trial_analytics('demo') data"))[0].data
  expect(empty.feedbackSummary).toEqual({count:0,averageRating:null})
  await expect(as(guest,"select trial_analytics('pilot-01')")).rejects.toThrow('FORBIDDEN')
 })
 it('ignores a self-assigned operations role at signup',async()=>{const rows=await as(guest,'select role from profiles where id=$1',[guest]);expect(rows[0].role).toBe('guest');await expect(as(guest,"update profiles set role='ops' where id=$1",[guest])).rejects.toThrow()})
 it('ignores a self-selected study batch at signup',async()=>{const fresh='55555555-5555-4555-8555-555555555555';await db.query("insert into auth.users values($1,$2)",[fresh,JSON.stringify({name:'New',batch_id:'pilot-01'})]);const rows=await as(fresh,'select batch_id from profiles');expect(rows[0].batch_id).toBe('demo')})
 it('lets only operations assign an inactive guest to a study batch',async()=>{await expect(as(demo,"select assign_guest_batch($1,'pilot-01')",[demo])).rejects.toThrow('FORBIDDEN');await as(ops,"select assign_guest_batch($1,'pilot-01')",[demo]);expect((await as(demo,'select batch_id from profiles'))[0].batch_id).toBe('pilot-01');const roster=await as<{id:string;has_activity:boolean}>(ops,'select * from participant_roster()');expect(roster.some(row=>row.id===demo&&!row.has_activity)).toBe(true)})
 it('locks cohort assignment after any participant activity',async()=>{await signal(demo);await expect(as(ops,"select assign_guest_batch($1,'pilot-01')",[demo])).rejects.toThrow('PARTICIPANT_HAS_ACTIVITY')})
 it('isolates guest records and blocks direct event writes',async()=>{await submit();expect(await as(other,'select * from bookings')).toHaveLength(0);await expect(as(guest,"insert into events values($1,'pilot-01','completed',now())",[guest])).rejects.toThrow();await expect(as(guest,"select trial_analytics('pilot-01')")).rejects.toThrow('FORBIDDEN')})
 it('persists exploration, but does not allow operations to read personal cards',async()=>{await as(guest,'select save_exploration($1)',[exploration]);expect((await as(guest,'select completed from explorations'))[0].completed).toBe(true);expect(await as(ops,'select * from explorations')).toHaveLength(0)})
 it('rejects malformed exploration rather than trusting completed flags',async()=>{await expect(as(guest,'select save_exploration($1)',[{...exploration,levels:['fake']}])).rejects.toThrow('INVALID_LEVEL');await expect(as(guest,'select save_exploration($1)',[null])).rejects.toThrow('INVALID_EXPLORATION')})
 it.each(['motif','palette','levels','answer'])('persists a cleared %s and marks the card incomplete',async field=>{
  await as(guest,'select save_exploration($1)',[exploration])
  const cleared={...exploration,[field]:field==='levels'?[]:''}
  await as(guest,'select save_exploration($1)',[cleared])
  expect((await as(guest,'select body,completed from explorations'))[0]).toEqual({body:cleared,completed:false})
 })
 it('validates recommendation against the server catalog',async()=>{await expect(as(guest,'select save_recommendation($1,$2,$3)',['workshop',{minutes:20,budget:200,party:'solo',interest:'experience'},request()])).rejects.toThrow('NO_MATCH');await expect(as(guest,'select save_recommendation($1,$2,$3)',['workshop',{minutes:90,budget:200,party:'business',interest:'experience'},request()])).rejects.toThrow('NO_MATCH')})
 it('makes duplicate network retries idempotent and rejects a second active request',async()=>{const key=request();const a=await submit(guest,1,key);expect(await submit(guest,1,key)).toBe(a);await expect(submit()).rejects.toThrow('DUPLICATE_INTENTION')})
 it('prevents an unauthorized actor from changing another request',async()=>{const id=await submit();await expect(as(other,"select transition_booking($1,'cancelled')",[id])).rejects.toThrow('FORBIDDEN');await expect(as(guest,"select transition_booking($1,'confirmed')",[id])).rejects.toThrow('FORBIDDEN')})
 it('enforces capacity, then releases it after a withdrawal',async()=>{const a=await submit(guest,2),b=await submit(other,1);await as(ops,"select transition_booking($1,'confirmed')",[a]);await expect(as(ops,"select transition_booking($1,'confirmed')",[b])).rejects.toThrow('CAPACITY_EXCEEDED');await as(guest,"select transition_booking($1,'cancelled')",[a]);await as(ops,"select transition_booking($1,'confirmed')",[b]);expect((await as(guest,'select available from available_sessions()'))[0].available).toBe(1)})
 it('requires a decline reason and preserves history',async()=>{const id=await submit();await expect(as(ops,"select transition_booking($1,'declined')",[id])).rejects.toThrow('REASON_REQUIRED');await as(ops,"select transition_booking($1,'declined','Choose tomorrow')",[id]);expect(await as(guest,'select * from booking_history')).toHaveLength(2)})
 it('blocks feedback before completion; accepts one feedback only',async()=>{const id=await submit();await expect(as(guest,'select submit_feedback($1,5,$2)',[id,'Good'])).rejects.toThrow('COMPLETED_BOOKING_REQUIRED');await as(ops,"select transition_booking($1,'confirmed')",[id]);await as(ops,"select transition_booking($1,'completed')",[id]);await as(guest,'select submit_feedback($1,5,$2)',[id,'Good']);await as(guest,'select submit_feedback($1,1,$2)',[id,'Retry']);expect((await as(guest,'select rating from feedback'))[0].rating).toBe(5);await expect(as(guest,"select transition_booking($1,'cancelled')",[id])).rejects.toThrow('INVALID_TRANSITION')})
 it('deduplicates the full funnel and separates demo from study users',async()=>{
  for(let n=0;n<2;n++)await as(guest,'select save_exploration($1)',[exploration])
  await as(demo,'select save_exploration($1)',[exploration])
  const rec=(await as<{id:string}>(guest,'select save_recommendation($1,$2,$3) id',['workshop',{minutes:90,budget:200,party:'family',interest:'craft'},request()]))[0].id
  const id=(await as<{id:string}>(guest,'select submit_intention($1,1,$2,$3) id',[session,request(),rec]))[0].id
  await as(ops,"select transition_booking($1,'confirmed')",[id]);await as(ops,"select transition_booking($1,'completed')",[id]);await as(guest,"select submit_feedback($1,5,'Helpful')",[id])
  const stats=(await as<{data:{counts:number[]}}>(ops,"select trial_analytics('pilot-01') data"))[0].data
  expect(stats.counts).toEqual([2,1,1,1,1,1,1,1])
 })
 it('stores idempotent structured guide signals without exposing them to operations',async()=>{const key=request();const first=await signal(guest,key,['craft','experience']);expect(await signal(guest,key,['craft','experience'])).toBe(first);expect(await as(guest,'select * from guide_signals')).toHaveLength(1);expect(await as(other,'select * from guide_signals')).toHaveLength(0);expect(await as(ops,'select * from guide_signals')).toHaveLength(0)})
 it('aggregates guide intent by cohort and excludes demo activity',async()=>{await signal(guest,request(),['craft','experience']);await signal(demo,request(),['culture']);const stats=(await as<{data:{guideIntent:{total:number;uniqueUsers:number;topicCounts:Record<string,number>;partyCounts:Record<string,number>;sentimentCounts:Record<string,number>;averageStayHours:number;averageBudget:number}}}>(ops,"select trial_analytics('pilot-01') data"))[0].data;expect(stats.guideIntent).toEqual({total:1,uniqueUsers:1,topicCounts:{craft:1,experience:1},partyCounts:{family:1},sentimentCounts:{positive:1},averageStayHours:2,averageBudget:150})})
 it('validates guide signal fields and rejects operations as a signal source',async()=>{await expect(signal(guest,request(),['invented'])).rejects.toThrow('INVALID_GUIDE_SIGNAL');await expect(signal(guest,request(),['craft','craft'])).rejects.toThrow('INVALID_GUIDE_SIGNAL');await expect(signal(ops)).rejects.toThrow('GUEST_REQUIRED')})
 it('computes two guests and their average budget on the server, excluding demo signals',async()=>{
  const key=request()
  const sql="select save_guide_signal($1,'zh',$2,2,$3,'solo',$4) id"
  await as(guest,sql,[key,['craft'],100,'negative'])
  await as(guest,sql,[key,['craft'],100,'negative'])
  await as(other,sql,[request(),['experience'],200,'neutral'])
  await as(demo,sql,[request(),['culture'],900,'positive'])
  expect(await as(other,'select * from guide_signals')).toHaveLength(1)
  expect(await as(ops,'select * from guide_signals')).toHaveLength(0)
  const stats=(await as<{data:{counts:number[];guideIntent:{total:number;uniqueUsers:number;averageBudget:number;sentimentCounts:Record<string,number>}}}>(ops,"select trial_analytics('pilot-01') data"))[0].data
  expect(stats.counts[0]).toBe(2)
  expect(stats.guideIntent).toMatchObject({total:2,uniqueUsers:2,averageBudget:150,sentimentCounts:{negative:1,neutral:1}})
 })
 it('does not put users who skipped exploration in downstream funnel',async()=>{await submit();const stats=(await as<{data:{counts:number[];statusCounts:Record<string,number>}}>(ops,"select trial_analytics('pilot-01') data"))[0].data;expect(stats.counts[4]).toBe(0);expect(stats.statusCounts.pending).toBe(1)})
 it('rejects a recommendation belonging to another user or another experience',async()=>{const rec=(await as<{id:string}>(other,'select save_recommendation($1,$2,$3) id',['scroll',{minutes:90,budget:200,party:'family',interest:'culture'},request()]))[0].id;await expect(as(guest,'select submit_intention($1,1,$2,$3)',[session,request(),rec])).rejects.toThrow('INVALID_RECOMMENDATION')})
 it('persists reviewer identity and forbids guest content approval',async()=>{await expect(as(guest,"select save_reviewed_content('copy','Title','Body','en','Checked')")).rejects.toThrow('FORBIDDEN');await as(ops,"select save_reviewed_content('copy','Title','Body','en','Checked')");expect((await as(ops,'select reviewer_id from reviewed_contents'))[0].reviewer_id).toBe(ops)})
 it('limits model calls without leaking quota rows',async()=>{for(let n=0;n<60;n++)await as(guest,'select claim_ai_request()');await expect(as(guest,'select claim_ai_request()')).rejects.toThrow('RATE_LIMIT');await expect(as(guest,'select * from ai_usage')).rejects.toThrow()})
 it('includes accommodation status and deduplicates content saves',async()=>{
  await db.exec("insert into stay_inventory select r.id,stay_today()+d,r.default_price,1 from stay_rooms r cross join generate_series(1,8) d on conflict do nothing")
  const q=(await db.query<any>("select quote_stay('classic','room_only',stay_today()+2,stay_today()+3,1) q")).rows[0].q
  await as(guest,'select submit_stay_request($1,$2,stay_today()+2,stay_today()+3,1,$3,$4)',['classic','room_only',q.token,request()])
  const stats=(await as<any>(ops,"select trial_analytics('pilot-01') data"))[0].data
  expect(stats.statusCounts.stay_pending).toBe(1)
  const req=request()
  const first=(await as<{id:string}>(ops,'select save_reviewed_content($1,$2,$3,$4,$5,$6) id',['itinerary','Title','Body','zh','Reviewed',req]))[0].id
  const second=(await as<{id:string}>(ops,'select save_reviewed_content($1,$2,$3,$4,$5,$6) id',['itinerary','Title','Body','zh','Reviewed',req]))[0].id
  expect(second).toBe(first)
  expect((await db.query('select * from reviewed_contents where request_id=$1',[req])).rows).toHaveLength(1)
 })
})
