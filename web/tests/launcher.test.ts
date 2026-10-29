import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

describe.runIf(process.platform==='win32')('Windows launcher ownership checks',()=>{
 it('reuses only this project, selects a free alternate port, and refuses two foreign services',()=>{
  const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/[\\/]$/,'')
  const fixture=root+'/.cache/improvement-20261028/launcher-node.ps1'
  mkdirSync(root+'/.cache/improvement-20261028',{recursive:true})
  writeFileSync(fixture,"Write-Output ('NODE_ARGS='+($args -join ' '))\nexit 0\n")
  const quote=(value:string)=>"'"+value.replace(/'/g,"''")+"'"
  function run(kind:'same'|'foreign'|'full'){
   const program=`
    function global:netstat.exe { $global:LASTEXITCODE=0; ' TCP 127.0.0.1:5181 0.0.0.0:0 LISTENING 100'; ${kind==='full'?"' TCP 127.0.0.1:5180 0.0.0.0:0 LISTENING 101'":''} }
    function global:Invoke-RestMethod { param($Uri,$TimeoutSec) return @{root=${quote(kind==='same'?root+'\\web':root+'\\another-project')};mode='demo'} }
    function global:Get-Command { param($Name,$ErrorAction) return @{Source=${quote(fixture)}} }
    & ${quote(root+'/scripts/start-demo.ps1')} -NoOpen
   `
   return spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(program,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000})
  }
  const same=run('same');expect(same.status,same.stderr).toBe(0);expect(same.stdout).toContain('already running');expect(same.stdout).not.toContain('NODE_ARGS=')
  const alternate=run('foreign');expect(alternate.status,alternate.stderr).toBe(0);expect(alternate.stdout).toContain('--port 5180');expect(alternate.stdout).not.toContain('already running')
  const full=run('full');expect(full.status).not.toBe(0);expect(full.stdout).not.toContain('NODE_ARGS=')
 },20000)
})
