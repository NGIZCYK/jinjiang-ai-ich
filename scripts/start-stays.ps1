param([switch]$NoOpen,[switch]$OpenHome)
$ErrorActionPreference='Stop'
$stayRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$stayWeb=Join-Path $stayRoot 'web'
$stayCache=Join-Path $stayRoot '.cache\stays-local'
New-Item -ItemType Directory -Force -Path $stayCache | Out-Null
$stayNode=(Get-Command node -ErrorAction SilentlyContinue).Source
$stayBundledNode=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if(Test-Path -LiteralPath $stayBundledNode) { $stayNode=$stayBundledNode }
if(-not $stayNode) { throw 'Install Node.js 24.22.1 before starting this preview.' }
& $stayNode (Join-Path $PSScriptRoot 'check-node-version.mjs')
if($LASTEXITCODE -ne 0) { throw 'This project requires Node.js 24.22.1 or later 24.x.' }
function Read-StayIdentity([string]$Address) {
 try {
  $reply=Invoke-WebRequest -UseBasicParsing -Uri $Address -TimeoutSec 2
  $reply.RawContentStream.Position=0
  $reader=New-Object IO.StreamReader($reply.RawContentStream,[Text.Encoding]::UTF8)
  return ($reader.ReadToEnd() | ConvertFrom-Json)
 } catch { return $null }
}
$identity=Read-StayIdentity 'http://127.0.0.1:54329/health'
if($identity -and ($identity.service -ne 'jinjiang-stays-local' -or $identity.root -ne $stayRoot)) { throw 'Port 54329 belongs to a different service.' }
if(-not $identity) {
 Start-Process -WindowStyle Hidden -FilePath $stayNode -ArgumentList @('"'+(Join-Path $PSScriptRoot 'stays-local-server.mjs')+'"') -WorkingDirectory $stayRoot -RedirectStandardOutput (Join-Path $stayCache 'database.log') -RedirectStandardError (Join-Path $stayCache 'database-error.log') | Out-Null
 for($attempt=0;$attempt -lt 30;$attempt++) { Start-Sleep -Milliseconds 500; $identity=Read-StayIdentity 'http://127.0.0.1:54329/health';if($identity){break} }
 if(-not $identity) { throw 'Local database did not start. See .cache/stays-local/database-error.log.' }
}
$frontend=Read-StayIdentity 'http://127.0.0.1:5184/__project_identity'
if($frontend -and ($frontend.root -ne $stayWeb -or $frontend.mode -ne 'stays')) { throw 'Port 5184 belongs to a different preview.' }
if(-not $frontend) {
 $vite=Join-Path $stayWeb 'node_modules\vite\bin\vite.js'
 Start-Process -WindowStyle Hidden -FilePath $stayNode -ArgumentList @('"'+$vite+'"','--mode','stays','--host','127.0.0.1','--port','5184','--strictPort') -WorkingDirectory $stayWeb -RedirectStandardOutput (Join-Path $stayCache 'frontend.log') -RedirectStandardError (Join-Path $stayCache 'frontend-error.log') | Out-Null
 for($attempt=0;$attempt -lt 20;$attempt++) { Start-Sleep -Milliseconds 500;$frontend=Read-StayIdentity 'http://127.0.0.1:5184/__project_identity';if($frontend){break} }
 if(-not $frontend) { throw 'Local preview did not start. See .cache/stays-local/frontend-error.log.' }
}
$stayAddress=if($OpenHome){'http://127.0.0.1:5184/'}else{'http://127.0.0.1:5184/stays'}
Write-Host "Local accommodation preview: $stayAddress"
Write-Host 'This preview uses a separate local database. No cloud data is changed.'
if(-not $NoOpen){Start-Process $stayAddress}
