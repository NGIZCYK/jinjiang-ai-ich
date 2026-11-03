import { readFileSync,existsSync,readdirSync,writeFileSync } from 'node:fs'
import { resolve,dirname,join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),cache=join(root,'.cache/room-v2-20261102'),dist=join(cache,'dist')
const manifest=JSON.parse(readFileSync(join(root,'assets-source/stay-rooms-20261102-v2/manifest.json'),'utf8'))
const old=JSON.parse(readFileSync(join(root,'assets-source/stay-rooms-20261102/manifest.json'),'utf8'))
const sha=b=>createHash('sha256').update(b).digest('hex'),checks=[]
function check(name,ok){assert.ok(ok,name);checks.push(name)}
check('four_versioned_originals',manifest.assets.length===4&&manifest.assets.every(a=>sha(readFileSync(join(root,a.original)))===a.originalSha256))
check('old_six_originals_preserved',old.assets.every(a=>sha(readFileSync(join(root,a.original)))===a.originalSha256))
check('eight_responsive_webp_files',manifest.outputs.length===8)
for(const a of manifest.outputs){const built=join(dist,a.file.replace('web/public/',''));check('built_'+a.id+'_'+a.width,existsSync(built)&&sha(readFileSync(built))===a.sha256&&a.bytes<=(a.id.endsWith('detail')?250:450)*1024);const r=await fetch('http://127.0.0.1:5182/'+a.file.replace('web/public/',''));check('served_'+a.id+'_'+a.width,r.ok&&sha(Buffer.from(await r.arrayBuffer()))===a.sha256)}
const suite=JSON.parse(readFileSync(join(cache,'suite-hashes.json'),'utf8'))
check('suite_webp_unchanged',Object.entries(suite).every(([p,hash])=>sha(readFileSync(join(root,p)))===hash))
const index=readFileSync(join(dist,'index.html'),'utf8'),entry=index.match(/src="\/assets\/([^"\s]+\.js)"/)?.[1];assert.ok(entry)
const visited=new Set(),pending=[entry],texts=[]
while(pending.length){const name=pending.pop();if(visited.has(name))continue;visited.add(name);const text=readFileSync(join(dist,'assets',name),'utf8');texts.push(text);for(const match of text.matchAll(/["'](?:\.\/|\/?assets\/)?([A-Za-z0-9_-]+\.js)["']/g))if(existsSync(join(dist,'assets',match[1]))&&!visited.has(match[1]))pending.push(match[1])}
const bundles=texts.join('\n');check('active_bundle_contains_new_and_suite_revisions',bundles.includes('20261102-v2')&&bundles.includes('suite-main')&&bundles.includes('embroidery-main')&&bundles.includes('classic-main'))
check('raw_originals_not_published',!readdirSync(join(dist,'assets/stays/20261102-v2')).some(name=>name.endsWith('.png')))
const identity=await fetch('http://127.0.0.1:5182/__project_identity').then(r=>r.json());check('current_stays_preview',identity.mode==='stays'&&identity.root===join(root,'web'))
const result={date:new Date().toISOString(),passed:checks.length,checks,realBrowserVerified:false,cloudWrites:false};writeFileSync(join(cache,'artifact-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
