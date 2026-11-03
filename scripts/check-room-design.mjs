import { readFileSync,existsSync,readdirSync,mkdirSync,writeFileSync } from 'node:fs'
import { dirname,resolve,join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),cache=join(root,'.cache/room-design-20261102'),dist=join(cache,'dist')
const manifest=JSON.parse(readFileSync(join(root,'assets-source/stay-rooms-20261102/manifest.json'),'utf8'))
const sha=data=>createHash('sha256').update(data).digest('hex')
const results=[];function check(name,ok){assert.ok(ok,name);results.push(name)}
check('six_distinct_concept_originals',manifest.assets.length===6&&new Set(manifest.assets.map(a=>a.id)).size===6&&manifest.assets.every(a=>existsSync(join(root,a.original))&&sha(readFileSync(join(root,a.original)))===a.originalSha256))
check('twelve_responsive_webp_outputs',manifest.outputs.length===12)
for(const asset of manifest.outputs){const source=join(root,asset.file),built=join(dist,asset.file.replace('web/public/',''));check('asset_'+asset.id+'_'+asset.width,existsSync(built)&&sha(readFileSync(source))===asset.sha256&&sha(readFileSync(built))===asset.sha256&&asset.bytes<=(asset.id.endsWith('detail')?250:450)*1024)}
// Follow the current entry graph, not stale chunks left by an earlier cached build.
const html=readFileSync(join(dist,'index.html'),'utf8'),entry=html.match(/src="\/assets\/([^"\s]+\.js)"/)?.[1]
assert.ok(entry,'Current entry script exists')
const visited=new Set(),texts=[],pending=[entry]
while(pending.length){const name=pending.pop();if(visited.has(name))continue;visited.add(name);const source=readFileSync(join(dist,'assets',name),'utf8');texts.push(source)
 for(const match of source.matchAll(/["'](?:\.\/|\/?assets\/)?([A-Za-z0-9_-]+\.js)["']/g))if(existsSync(join(dist,'assets',match[1]))&&!visited.has(match[1]))pending.push(match[1])
}
const bundles=texts.join('\n')
check('detail_route_and_gallery_included',bundles.includes('/stays/:roomId')&&bundles.includes('room-gallery')&&bundles.includes('room-booking'))
check('local_backend_preserved',bundles.includes('http://127.0.0.1:54329'))
check('raw_generation_files_not_published',!existsSync(join(dist,'assets-source'))&&!readdirSync(join(dist,'assets/stays/20261102')).some(p=>p.endsWith('.png')))
const health=await fetch('http://127.0.0.1:54329/health').then(r=>r.json());check('local_database_identity',health.service==='jinjiang-stays-local')
const identity=await fetch('http://127.0.0.1:5182/__project_identity').then(r=>r.json());check('current_frontend_identity',identity.mode==='stays'&&identity.root===join(root,'web'))
for(const path of ['/stays','/stays/classic','/stays/embroidery','/stays/suite']){const r=await fetch('http://127.0.0.1:5182'+path);check('route_shell_'+path,r.ok&&(await r.text()).includes('id="root"'))}
for(const asset of manifest.outputs){const r=await fetch('http://127.0.0.1:5182/'+asset.file.replace('web/public/',''));check('served_'+asset.id+'_'+asset.width,r.ok&&r.headers.get('content-type')?.includes('image/webp')&&sha(Buffer.from(await r.arrayBuffer()))===asset.sha256)}
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());function day(n){const d=new Date(today+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
const response=await fetch('http://127.0.0.1:54329/rest/v1/rpc/search_stays',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5182'},body:JSON.stringify({p_in:day(3),p_out:day(5),p_guests:2})});const quotes=await response.json()
check('three_rooms_two_plans_each',response.ok&&Array.isArray(quotes)&&quotes.length===6&&new Set(quotes.map(q=>q.room_id)).size===3)
check('nightly_quote_logic_preserved',quotes.every(q=>q.total===q.nights.reduce((sum,n)=>sum+n.price,0)+q.surcharge))
const out={date:new Date().toISOString(),passed:results.length,checks:results,mutations:false,cloudWrites:false,realBrowserVerified:false}
mkdirSync(cache,{recursive:true});writeFileSync(join(cache,'artifact-http-results.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2))
