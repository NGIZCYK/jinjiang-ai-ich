import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_BACKEND } from './check-live-site.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'web', 'dist')
function files(dir) { return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]) }
const text = files(dist).filter(p => /\.(js|css|html|json)$/.test(p)).map(p => readFileSync(p,'utf8')).join('\n')
const publicEnv = readFileSync(join(root,'web','.env.demo'),'utf8')
const publicValue = name => publicEnv.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim()
const approvedDemoValues = ['GUEST','OPS'].flatMap(role => ['EMAIL','PASSWORD'].map(field => publicValue(`VITE_DEMO_${role}_${field}`)))
const env = existsSync(join(root,'web','.env.demo.local')) ? readFileSync(join(root,'web','.env.demo.local'),'utf8') : ''
const privateValues = env.split(/\r?\n/).flatMap(line => {
  const match=line.match(/^(?:VITE_)?DEMO_OPS_(?:PASSWORD|EMAIL)=(.*)$/)
  const value=match?.[1]?.trim().replace(/^['"]|['"]$/g,'')
  return value && !approvedDemoValues.includes(value) ? [value] : []
})
const privilegedJwt = [...text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)].some(([jwt]) => {
  try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).role === 'service_role' } catch { return false }
})
const checks = {
  isolatedDemoBackend: text.includes(DEMO_BACKEND) && ['uxfxhqdfrzkafekrbzcf', 'itfpnfaieurelroxbrvy'].every(ref => !text.includes(`https://${ref}.supabase.co`)),
  demoAccountsIncluded: approvedDemoValues.every(value => Boolean(value) && text.includes(value)),
  privateCredentialsAbsent: privateValues.every(value => !text.includes(value)) && !privilegedJwt && !/sb_secret_[A-Za-z0-9_-]{16,}/.test(text),
  materialInterfaceIncluded: ['silk-study','silk-view-nav','silk-light-options'].every(marker => text.includes(marker)),
  developmentAssetsAbsent: !existsSync(join(dist,'avatar','wanniang-puppet','raw')) && !existsSync(join(dist,'avatar','wanniang-puppet','preview')),
  runtimePortraitPresent: existsSync(join(dist,'avatar','wanniang-v3','portrait.webp')) && text.includes('/avatar/wanniang-v3/portrait.webp'),
  runtimeHeroPresent: ['desktop','mobile'].every(variant => ['videos/home-embroidery-20261101-v2-'+variant+'.mp4','assets/home-embroidery-20261101-v2-'+variant+'.webp'].every(path => existsSync(join(dist,path)) && text.includes('/'+path))),
  runtimeHeroWithinBudget: ['desktop','mobile'].every(variant => { const path=join(dist,'videos','home-embroidery-20261101-v2-'+variant+'.mp4'); return existsSync(path) && statSync(path).size>0 && statSync(path).size<(variant==='desktop'?8:4)*1024*1024 }),
}
console.log(JSON.stringify(checks,null,2))
if (Object.values(checks).some(value => !value)) process.exitCode=1
