import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_BACKEND } from './check-live-site.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'web', 'dist')
function files(dir) { return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]) }
const text = files(dist).filter(p => /\.(js|css|html|json)$/.test(p)).map(p => readFileSync(p,'utf8')).join('\n')
const env = existsSync(join(root,'web','.env.demo.local')) ? readFileSync(join(root,'web','.env.demo.local'),'utf8') : ''
const privateValues = env.split(/\r?\n/).flatMap(line => {
  const match=line.match(/^(?:VITE_)?DEMO_OPS_(?:PASSWORD|EMAIL)=(.*)$/)
  const value=match?.[1]?.trim().replace(/^['"]|['"]$/g,'')
  return value ? [value] : []
})
const checks = {
  isolatedDemoBackend: text.includes(DEMO_BACKEND) && ['uxfxhqdfrzkafekrbzcf', 'itfpnfaieurelroxbrvy'].every(ref => !text.includes(`https://${ref}.supabase.co`)),
  operationsCredentialsAbsent: privateValues.every(value => !text.includes(value)) && !/VITE_DEMO_OPS_(PASSWORD|EMAIL)/.test(text),
  materialInterfaceIncluded: ['silk-study','silk-view-nav','silk-light-options'].every(marker => text.includes(marker)),
  developmentAssetsAbsent: !existsSync(join(dist,'avatar','wanniang-puppet','raw')) && !existsSync(join(dist,'avatar','wanniang-puppet','preview')),
  runtimePortraitPresent: ['base.webp','eyes.webp'].every(name => existsSync(join(dist,'avatar','wanniang-puppet',name))),
}
console.log(JSON.stringify(checks,null,2))
if (Object.values(checks).some(value => !value)) process.exitCode=1
