// @vitest-environment node
import { beforeAll,beforeEach,afterAll,describe,it,expect } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync,readdirSync } from 'node:fs'
const guest='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',ops='33333333-3333-4333-8333-333333333333'
const slot='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',alternative='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
let db:PGlite
async function as<T=Record<string,unknown>>(id:string,sql:string,args:unknown[]=[]){await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);try{return (await db.query<T>(sql,args)).rows}finally{await db.exec('reset role')}}
async function quote(plan='room_only',room='classic'){return (await db.query<{q:any}>("select quote_stay($1,$2,stay_today()+2,stay_today()+4,2) q",[room,plan])).rows[0].q}
async function submit(id=guest,plan='room_only',room='classic',key=crypto.randomUUID()){const q=await quote(plan,room);return (await as<{id:string}>(id,'select submit_stay_request($1,$2,stay_today()+2,stay_today()+4,2,$3,$4) id',[room,plan,q.token,key]))[0].id}
async function transition(id:string,status:string,session:string|null=null,reason=''){return as(ops,'select transition_stay_booking($1,$2,$3,$4)',[id,status,reason,session])}
beforeAll(async()=>{
 db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;")
 for(const name of readdirSync(new URL('../../supabase/migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())await db.exec(readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'))
})
beforeEach(async()=>{
 await db.exec('truncate profiles cascade;truncate sessions cascade;truncate stay_inventory;delete from auth.users;')
 for(const id of [guest,other,ops])await db.query('insert into auth.users values($1,$2)',[id,JSON.stringify({name:'Test'})])
 await db.query("update profiles set role='ops' where id=$1",[ops])
 await db.exec('insert into stay_inventory select r.id,stay_today()+d,r.default_price,1 from stay_rooms r cross join generate_series(1,8) d')
 await db.query("insert into sessions(id,experience_id,starts_at,capacity) values($1,'workshop',stay_time(stay_today()+2,16),3),($2,'workshop',stay_time(stay_today()+3,16),3)",[slot,alternative])
})
afterAll(async()=>{await db.close()})
describe('Accommodation pricing, occupancy, entitlements and access',()=>{
 it('sums nightly prices, adds the package once, and treats checkout as exclusive',async()=>{
  await db.exec("update stay_inventory set price=90000 where room_id='classic' and night=stay_today()+3")
  const q=await quote('heritage');expect(q.nights).toHaveLength(2);expect(q.room_total).toBe(158000);expect(q.total).toBe(176000)
  const id=await submit();await transition(id,'confirmed')
  const after=(await db.query<{q:any}>("select quote_stay('classic','room_only',stay_today()+4,stay_today()+5,2) q")).rows[0].q;expect(after.available).toBe(1)
 })
 it('validates all date and guest boundaries on the server',async()=>{
  for(const [start,end,guests] of [[0,1,2],[91,92,2],[2,2,2],[2,17,2],[2,3,0],[2,3,3]])await expect(db.query("select quote_stay('classic','room_only',stay_today()+$1::int,stay_today()+$2::int,$3)",[start,end,guests])).rejects.toThrow(/STAY_DATES_INVALID|STAY_GUESTS_INVALID/)
  await expect(db.query("select quote_stay('unknown','room_only',stay_today()+1,stay_today()+2,2)")).rejects.toThrow('STAY_ROOM_INVALID')
 })
 it('does not sell a stay when one night is missing or sold out',async()=>{
  await db.exec("delete from stay_inventory where room_id='classic' and night=stay_today()+3")
  expect((await quote()).available).toBe(0);await expect(submit()).rejects.toThrow('STAY_SOLD_OUT')
 })
 it('requires a fresh quote after price changes and preserves the submitted price afterwards',async()=>{
  const q=await quote();await db.exec("update stay_inventory set price=70000 where room_id='classic'")
  await expect(as(guest,"select submit_stay_request('classic','room_only',stay_today()+2,stay_today()+4,2,$1,$2)",[q.token,crypto.randomUUID()])).rejects.toThrow('STAY_PRICE_CHANGED')
  const id=await submit();await db.exec("update stay_inventory set price=90000 where room_id='classic'");await transition(id,'confirmed')
  expect((await as<any>(guest,'select quote from stay_bookings where id=$1',[id]))[0].quote.total).toBe(140000)
 })
 it('deduplicates retries, rejects duplicate active orders and allows a new request after cancellation',async()=>{
  const key=crypto.randomUUID();const id=await submit(guest,'room_only','classic',key);expect(await submit(guest,'room_only','classic',key)).toBe(id)
  await expect(submit()).rejects.toThrow('STAY_DUPLICATE');await as(guest,"select transition_stay_booking($1,'cancelled')",[id]);expect(await submit()).not.toBe(id)
 })
 it('does not reserve rooms for pending requests and refuses the second confirmation for the last room',async()=>{
  const first=await submit();const second=await submit(other);expect((await quote()).available).toBe(1)
  await transition(first,'confirmed');await expect(transition(second,'confirmed')).rejects.toThrow('STAY_SOLD_OUT')
  expect((await as<any>(other,'select status from stay_bookings where id=$1',[second]))[0].status).toBe('pending')
 })
 it('atomically refuses accommodation confirmation when the included experience is unavailable',async()=>{
  const id=await submit(guest,'heritage');await db.exec('update sessions set capacity=1')
  await expect(transition(id,'confirmed')).rejects.toThrow('STAY_BENEFIT_UNAVAILABLE');expect((await quote()).available).toBe(1)
  expect(await as(guest,'select * from stay_entitlements')).toHaveLength(0)
 })
 it('protects held places from independent confirmations and converts a hold without double counting',async()=>{
  const id=await submit(guest,'heritage');await transition(id,'confirmed',slot)
  let free=(await as<any>(other,'select * from available_sessions()')).find((s:any)=>s.id===slot);expect(free.available).toBe(1)
  const a=(await as<{id:string}>(other,'select submit_intention($1,2,$2) id',[slot,crypto.randomUUID()]))[0].id
  await expect(as(ops,"select transition_booking($1,'confirmed')",[a])).rejects.toThrow('CAPACITY_EXCEEDED')
  const booking=(await as<{id:string}>(guest,'select redeem_stay_entitlement($1,$2) id',[id,slot]))[0].id
  expect((await as<any>(guest,'select * from bookings where id=$1',[booking]))[0].status).toBe('confirmed')
  free=(await as<any>(other,'select * from available_sessions()')).find((s:any)=>s.id===slot);expect(free.available).toBe(1)
  expect((await as<{id:string}>(guest,'select redeem_stay_entitlement($1,$2) id',[id,slot]))[0].id).toBe(booking)
 })
 it('keeps the original guarantee after a failed reschedule, then swaps places atomically',async()=>{
  const id=await submit(guest,'heritage');await transition(id,'confirmed',slot);await db.query('update sessions set capacity=1 where id=$1',[alternative])
  await expect(as(guest,'select redeem_stay_entitlement($1,$2)',[id,alternative])).rejects.toThrow('STAY_BENEFIT_UNAVAILABLE')
  expect((await as<any>(guest,'select session_id from stay_entitlements'))[0].session_id).toBe(slot)
  await db.query('update sessions set capacity=3 where id=$1',[alternative]);const a=(await as<{id:string}>(guest,'select redeem_stay_entitlement($1,$2) id',[id,alternative]))[0].id
  await as(guest,'select reschedule_stay_experience($1,$2)',[id,slot]);expect((await as<any>(guest,'select session_id from bookings where id=$1',[a]))[0].session_id).toBe(slot)
 })
 it('releases accommodation, held benefits and converted activities when cancelling',async()=>{
  const id=await submit(guest,'heritage');await transition(id,'confirmed',slot);const a=(await as<{id:string}>(guest,'select redeem_stay_entitlement($1,$2) id',[id,slot]))[0].id
  await expect(as(guest,"select transition_booking($1,'cancelled')",[a])).rejects.toThrow('STAY_USE_ORDER_ACTION')
  await as(guest,"select transition_stay_booking($1,'cancelled')",[id]);expect((await quote()).available).toBe(1)
  expect((await as<any>(guest,'select status from stay_entitlements'))[0].status).toBe('cancelled')
  expect((await as<any>(guest,'select status from bookings'))[0].status).toBe('cancelled')
  expect((await as<any>(other,'select * from available_sessions()')).find((s:any)=>s.id===slot).available).toBe(3)
 })
 it('expires unredeemed benefits at the held start time',async()=>{
  const id=await submit(guest,'heritage');await transition(id,'confirmed',slot);await db.query("update sessions set starts_at=now()-interval '1 minute' where id=$1",[slot])
  await expect(as(guest,'select redeem_stay_entitlement($1,$2)',[id,alternative])).rejects.toThrow('STAY_BENEFIT_EXPIRED')
 })
 it('prevents room inventory reductions below occupied rooms and forbids guest writes',async()=>{
  const id=await submit();await transition(id,'confirmed');await expect(as(ops,"select set_stay_inventory('classic',stay_today()+2,70000,0)")).rejects.toThrow('STAY_CAPACITY_BELOW_BOOKED')
  await expect(as(guest,"select set_stay_inventory('classic',stay_today()+2,1,100)")).rejects.toThrow('FORBIDDEN')
  await expect(as(guest,"update stay_inventory set capacity=100")).rejects.toThrow()
  await expect(as(guest,"update stay_bookings set status='confirmed'")).rejects.toThrow()
 })
 it('isolates guest orders, benefits, histories and private capacity details',async()=>{
  const id=await submit(guest,'heritage');await transition(id,'confirmed',slot)
  for(const table of ['stay_bookings','stay_entitlements','stay_history','stay_inventory'])expect(await as(other,`select * from ${table}`)).toHaveLength(0)
  await expect(as(other,'select stay_session_options($1)',[id])).rejects.toThrow('FORBIDDEN')
  await expect(as(other,"select transition_stay_booking($1,'cancelled')",[id])).rejects.toThrow('FORBIDDEN')
  await expect(as(guest,"select transition_activity_booking_base($1,'confirmed','')",[crypto.randomUUID()])).rejects.toThrow()
  expect(await as(ops,'select * from stay_bookings')).toHaveLength(1)
 })
 it('requires reasons and enforces the check-in and check-out time gates',async()=>{
  const id=await submit();await expect(transition(id,'declined')).rejects.toThrow('REASON_REQUIRED');await transition(id,'confirmed')
  await expect(transition(id,'checked_in')).rejects.toThrow('STAY_TRANSITION_INVALID')
  await db.query('update stay_bookings set check_in=stay_today()-1,check_out=stay_today()+1 where id=$1',[id]);await transition(id,'checked_in')
  await expect(as(guest,"select transition_stay_booking($1,'cancelled')",[id])).rejects.toThrow('STAY_TRANSITION_INVALID')
  await expect(transition(id,'checked_out')).rejects.toThrow('STAY_TRANSITION_INVALID')
  // Checkout is allowed only once 12:00 Shanghai has passed; use yesterday for deterministic coverage.
  await db.query('update stay_bookings set check_in=stay_today()-2,check_out=stay_today()-1 where id=$1',[id]);await transition(id,'checked_out')
 })
 it('exposes the nightly rate calendar and pre-booking workshop preview without private inventory',async()=>{
  const rates=await as<any>(other,'select * from stay_rate_calendar()')
  expect(rates).toHaveLength(8);expect(Number(rates[0].price)).toBe(68000);expect(Number(rates[0].available)).toBe(3)
  const roomRates=await as<any>(other,"select * from stay_rate_calendar('classic')")
  expect(Number(roomRates[0].available)).toBe(1)
  const preview=await as<any>(other,"select * from stay_session_preview('heritage',stay_today()+2,stay_today()+4)")
  expect(preview.map((row:any)=>row.id).sort()).toEqual([slot,alternative].sort())
  expect(Number(preview[0].available)).toBe(3)
  expect(await as<any>(other,"select * from stay_session_preview('room_only',stay_today()+2,stay_today()+4)")).toHaveLength(0)
 })
 it('records a guest-preferred workshop session and holds it at confirmation',async()=>{
  const q=await quote('heritage');const key=crypto.randomUUID()
  const id=(await as<{id:string}>(guest,'select submit_stay_request($1,$2,stay_today()+2,stay_today()+4,2,$3,$4,$5) id',['classic','heritage',q.token,key,alternative]))[0].id
  await transition(id,'confirmed')
  expect((await as<any>(guest,'select session_id from stay_entitlements where booking_id=$1',[id]))[0].session_id).toBe(alternative)
  const q2=await quote('heritage','suite')
  await expect(as(other,"select submit_stay_request('suite','heritage',stay_today()+2,stay_today()+4,2,$1,$2,$3)",[q2.token,crypto.randomUUID(),crypto.randomUUID()])).rejects.toThrow('STAY_BENEFIT_UNAVAILABLE')
 })
 it('locks cohort assignment after accommodation participation and reports it to operations',async()=>{
  await submit();const roster=await as<any>(ops,'select * from participant_roster()');expect(roster.find(r=>r.id===guest).has_activity).toBe(true)
  await expect(as(ops,"select assign_guest_batch($1,'pilot-01')",[guest])).rejects.toThrow('PARTICIPANT_HAS_ACTIVITY')
 })
})
