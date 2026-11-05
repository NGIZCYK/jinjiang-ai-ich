// Loopback-only PostgreSQL-compatible demo. Uses existing PGlite; never contacts a cloud database.
import http from 'node:http'
import { createRequire } from 'node:module'
import { readFileSync,mkdirSync,existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname,resolve,join } from 'node:path'
import { createHmac,randomBytes,randomUUID,scryptSync,timingSafeEqual } from 'node:crypto'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const require=createRequire(join(root,'web/package.json'))
const {PGlite}=require('@electric-sql/pglite')
const {readdirSync}=await import('node:fs')
const cache=join(root,'.cache/stays-local');mkdirSync(cache,{recursive:true})
const db=new PGlite(join(cache,'database'))
const publicEnv=readFileSync(join(root,'web/.env.demo'),'utf8')
const value=name=>publicEnv.match(new RegExp(`^${name}=(.*)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const accounts=['GUEST','OPS'].map((role,index)=>({id:index?'33333333-3333-4333-8333-333333333333':'11111111-1111-4111-8111-111111111111',email:value(`VITE_DEMO_${role}_EMAIL`),password:value(`VITE_DEMO_${role}_PASSWORD`),role:role.toLowerCase()}))
if(accounts.some(a=>!a.email||!a.password))throw new Error('Public demo accounts are not configured')
const migrations=join(root,'supabase/migrations')
const migrationNames=readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort()
const initialized=(await db.query("select to_regclass('public.stay_bookings') present")).rows[0].present
if(!initialized){
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text unique not null,raw_user_meta_data jsonb default '{}'::jsonb,password_hash text not null);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;")
 for(const name of migrationNames)await db.exec(readFileSync(join(migrations,name),'utf8'))
 for(const a of accounts){await db.query('insert into auth.users(id,email,raw_user_meta_data,password_hash) values($1,$2,$3,$4)',[a.id,a.email,JSON.stringify({name:a.role==='ops'?'Local operator':'Local guest'}),scryptSync(a.password,a.email,32).toString('hex')]);if(a.role==='ops')await db.query("update profiles set role='ops' where id=$1",[a.id])}
}
const tracked=(await db.query("select to_regclass('public.local_demo_migrations') present")).rows[0].present
if(!tracked){
 await db.exec('create table public.local_demo_migrations(name text primary key);revoke all on public.local_demo_migrations from anon,authenticated;')
 // The first local build already contained migration 0005; preserve its data when upgrading.
 for(const name of migrationNames.filter(n=>!initialized||n<='202611020005_stays.sql'))await db.query('insert into local_demo_migrations values($1)',[name])
}
const applied=new Set((await db.query('select name from local_demo_migrations')).rows.map(r=>r.name))
for(const name of migrationNames.filter(n=>!applied.has(n)))await db.transaction(async tx=>{await tx.exec(readFileSync(join(migrations,name),'utf8'));await tx.query('insert into local_demo_migrations values($1)',[name])})
await db.exec(readFileSync(join(root,'supabase/stay-demo-seed.sql'),'utf8'))
await db.exec("insert into sessions(experience_id,starts_at,capacity) select e.id,stay_time(stay_today()+d,10),8 from experiences e cross join generate_series(1,90) d where e.id in ('scroll','materials') on conflict do nothing")
const secret=randomBytes(32),refreshTokens=new Map()
function signed(value){return createHmac('sha256',secret).update(value).digest('base64url')}
function token(id){const payload=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}`;return `${payload}.${signed(payload)}`}
function identity(req){const t=req.headers.authorization?.replace(/^Bearer /,'');if(!t)return null;const p=t.split('.');if(p.length!==3)return null;const expected=Buffer.from(signed(p[0]+'.'+p[1]));const supplied=Buffer.from(p[2]);if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return null;try{const body=JSON.parse(Buffer.from(p[1],'base64url'));return body.exp>Date.now()/1000?body.sub:null}catch{return null}}
async function userObject(id){const row=(await db.query('select id,email,raw_user_meta_data from auth.users where id=$1',[id])).rows[0];return row?{id:row.id,email:row.email,role:'authenticated',aud:'authenticated',user_metadata:row.raw_user_meta_data,app_metadata:{provider:'email'},created_at:new Date().toISOString()}:null}
async function session(id){const refresh=randomUUID();refreshTokens.set(refresh,id);return {access_token:token(id),token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:refresh,user:await userObject(id)}}
function response(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data,(key,v)=>typeof v==='bigint'?Number(v):['check_in','check_out','night'].includes(key)&&typeof v==='string'?v.slice(0,10):v))}
async function body(req){let result='';for await(const chunk of req){result+=chunk;if(result.length>128000)throw new Error('REQUEST_TOO_LARGE')}return result?JSON.parse(result):{}}
const tables=new Set(['profiles','experiences','sessions','explorations','preferences','recommendations','bookings','booking_history','feedback','events','reviewed_contents','stay_rooms','stay_plans','stay_inventory','stay_bookings','stay_history','stay_entitlements'])
const functions=new Set(['search_stays','quote_stay','submit_stay_request','stay_session_options','transition_stay_booking','redeem_stay_entitlement','reschedule_stay_experience','set_stay_inventory','available_sessions','stay_rate_calendar','stay_session_preview','start_exploration','save_exploration','save_recommendation','submit_intention','transition_booking','submit_feedback','save_reviewed_content','save_guide_signal','stay_clock','participant_roster','assign_guest_batch','trial_analytics'])
const identifier=v=>{if(!/^[a-z_][a-z_0-9]*$/.test(v))throw new Error('INVALID_IDENTIFIER');return `"${v}"`}
async function asUser(uid,fn){return db.transaction(async tx=>{await tx.exec(`set local role ${uid?'authenticated':'anon'}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);return fn(tx)})}
async function handle(req,res){
 const origin=req.headers.origin
 if(origin&&!/^http:\/\/(127\.0\.0\.1|localhost):5184$/.test(origin)){response(res,403,{message:'LOCAL_ORIGIN_ONLY'});return}
 if(origin)res.setHeader('Access-Control-Allow-Origin',origin)
 res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,prefer,accept-profile,content-profile,range,range-unit,x-supabase-api-version')
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Expose-Headers','Content-Range')
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
 const url=new URL(req.url,'http://127.0.0.1:54329');const uid=identity(req)
 if(url.pathname==='/health'){response(res,200,{service:'jinjiang-stays-local',root,version:'2026.11.04-merged-v1',database:'local-only',pid:process.pid,migrations:migrationNames});return}
 if(url.pathname.startsWith('/auth/v1/')){
  if(url.pathname.endsWith('/token')&&req.method==='POST'){
   const b=await body(req)
   if(url.searchParams.get('grant_type')==='refresh_token'){const id=refreshTokens.get(b.refresh_token);if(!id){response(res,400,{error:'invalid_grant',error_description:'Local session expired. Sign in again.'});return}response(res,200,await session(id));return}
   const email=String(b.email||'').toLowerCase();const row=(await db.query('select id,password_hash from auth.users where lower(email)=$1',[email])).rows[0]
   if(!row||scryptSync(String(b.password||''),email,32).toString('hex')!==row.password_hash){response(res,400,{error:'invalid_grant',error_description:'Invalid login credentials'});return}response(res,200,await session(row.id));return
  }
  if(url.pathname.endsWith('/signup')&&req.method==='POST'){
   const b=await body(req),email=String(b.email||'').toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||String(b.password||'').length<6){response(res,400,{message:'Invalid email or password'});return}
   const id=randomUUID();await db.query('insert into auth.users(id,email,raw_user_meta_data,password_hash) values($1,$2,$3,$4)',[id,email,JSON.stringify({name:String(b.data?.name||'Local guest').slice(0,100)}),scryptSync(String(b.password),email,32).toString('hex')]);response(res,200,await session(id));return
  }
  if(url.pathname.endsWith('/user')&&uid){response(res,200,await userObject(uid));return}
  if(url.pathname.endsWith('/logout')){if(uid)for(const [key,id] of refreshTokens)if(id===uid)refreshTokens.delete(key);response(res,200,{});return}
  response(res,401,{message:'Local sign-in required'});return
 }
 if(url.pathname.startsWith('/functions/')){response(res,503,{error:'Local demo: cloud AI services are not connected. Use curated guide content.'});return}
 if(url.pathname.startsWith('/rest/v1/rpc/')&&req.method==='POST'){
  const name=url.pathname.split('/').at(-1);if(!functions.has(name)){response(res,404,{message:'RPC_NOT_AVAILABLE'});return}
  const args=await body(req);const entries=Object.entries(args);const named=entries.map(([key],i)=>`${identifier(key)} => $${i+1}`).join(',')
  const meta=(await db.query('select proretset from pg_proc where pronamespace=\'public\'::regnamespace and proname=$1',[name])).rows[0]
  const result=await asUser(uid,tx=>tx.query(meta.proretset?`select * from public.${identifier(name)}(${named})`:`select public.${identifier(name)}(${named}) result`,entries.map(([,value])=>value)))
  response(res,200,meta.proretset?result.rows:result.rows[0]?.result??null);return
 }
 if(url.pathname.startsWith('/rest/v1/')&&req.method==='GET'){
  const table=url.pathname.split('/').at(-1);if(!tables.has(table)){response(res,404,{message:'TABLE_NOT_AVAILABLE'});return}
  const conditions=[],args=[];for(const [key,value] of url.searchParams){if(['select','order','limit','offset'].includes(key))continue;const match=value.match(/^(eq|gte|lte|gt|lt)\.(.*)$/);if(!match)throw new Error('UNSUPPORTED_FILTER');args.push(match[2]);conditions.push(`${identifier(key)} ${ {eq:'=',gte:'>=',lte:'<=',gt:'>',lt:'<'}[match[1]] } $${args.length}`)}
  let select='t.*';if(table==='bookings')select+=', (select to_jsonb(s) from sessions s where s.id=t.session_id) sessions, (select to_jsonb(f) from feedback f where f.booking_id=t.id) feedback'
  if(table==='stay_bookings')select+=', (select to_jsonb(e) from stay_entitlements e where e.booking_id=t.id) stay_entitlements'
  const order=(url.searchParams.get('order')||'').split(',').filter(Boolean).map(v=>{const [key,direction]=v.split('.');return `${identifier(key)} ${direction==='desc'?'desc':'asc'}`}).join(',')
  const limit=Math.max(1,Math.min(5000,Number(url.searchParams.get('limit'))||5000));const offset=Math.max(0,Number(url.searchParams.get('offset'))||0)
  const result=await asUser(uid,tx=>tx.query(`select ${select} from public.${identifier(table)} t ${conditions.length?'where '+conditions.join(' and '):''}${order?' order by '+order:''} limit ${limit} offset ${offset}`,args))
  if(req.headers.accept?.includes('vnd.pgrst.object')){if(result.rows.length!==1){response(res,406,{code:'PGRST116',message:'Expected one record',details:`The result contains ${result.rows.length} rows`});return}response(res,200,result.rows[0]);return}
  res.setHeader('Content-Range',`0-${Math.max(result.rows.length-1,0)}/*`);response(res,200,result.rows);return
 }
 response(res,404,{message:'LOCAL_ROUTE_NOT_AVAILABLE'})
}
// PGlite has one connection: queue complete requests so auth context never crosses requests.
let queue=Promise.resolve()
const server=http.createServer((req,res)=>{queue=queue.then(()=>handle(req,res)).catch(error=>{if(!res.headersSent)response(res,400,{message:error.message,code:error.code||'LOCAL_ERROR'});else res.end()})})
server.listen(54329,'127.0.0.1',()=>process.stdout.write('Local accommodation database ready at http://127.0.0.1:54329 (no cloud writes)\n'))
async function close(){server.close();await db.close();process.exit(0)}
process.on('SIGINT',close);process.on('SIGTERM',close)
