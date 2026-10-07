param([switch]$SkipChecks)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot '.cache/release-20261004'
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
if (!$SkipChecks) {
  & (Join-Path $projectRoot 'analytics/recompute.ps1')
  Push-Location (Join-Path $projectRoot 'web')
  try {
    npm run test
    if ($LASTEXITCODE -ne 0) { throw 'Regression tests failed.' }
    $buildTemp = Join-Path $projectRoot 'web/.cache/build-temp'
    New-Item -ItemType Directory -Force -Path $buildTemp | Out-Null
    $previousTemp, $previousTmp = $env:TEMP, $env:TMP
    try { $env:TEMP=$buildTemp; $env:TMP=$buildTemp; npm run build:demo }
    finally { $env:TEMP=$previousTemp; $env:TMP=$previousTmp }
    if ($LASTEXITCODE -ne 0) { throw 'Demo build failed.' }
  } finally { Pop-Location }
}
node (Join-Path $PSScriptRoot 'check-demo-build.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Public artifact checks failed.' }
Compress-Archive -Path (Join-Path $projectRoot 'web/dist/*') -DestinationPath (Join-Path $releaseDir 'frontend-demo.zip') -Force
Compress-Archive -Path (Join-Path $projectRoot 'supabase/functions/concierge'),(Join-Path $projectRoot 'supabase/functions/_shared') -DestinationPath (Join-Path $releaseDir 'concierge-source.zip') -Force
Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $releaseDir 'frontend-demo.zip'),(Join-Path $releaseDir 'concierge-source.zip') |
  Select-Object @{Name='file';Expression={Split-Path -Leaf $_.Path}},Hash |
  ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $releaseDir 'manifest.json')
Write-Output "Prepared local artifacts: $releaseDir"
