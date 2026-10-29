param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$projectWeb = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\web')).Path
Set-Location -LiteralPath $projectWeb
function Test-PortInUse([int]$Port) {
    $listeners = & netstat.exe -ano -p TCP
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect local ports. Please retry from a normal terminal.' }
    return [bool]($listeners -match "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+\d+")
}
$demoPort = $null
foreach ($candidate in @(5181,5180)) {
    if (-not (Test-PortInUse $candidate)) { if ($null -eq $demoPort) { $demoPort=$candidate }; continue }
    try {
        $identity = Invoke-RestMethod -Uri "http://127.0.0.1:$candidate/__project_identity" -TimeoutSec 2
        if ($identity.root -and [IO.Path]::GetFullPath($identity.root).TrimEnd('\') -eq $projectWeb.TrimEnd('\') -and $identity.mode -eq 'demo') {
            Write-Host "This project is already running: $projectWeb (port $candidate)"
            if (-not $NoOpen) { Start-Process "http://127.0.0.1:$candidate/" }
            exit 0
        }
    } catch { # Another project may own this port. Never open it as this project.
    }
}
if ($null -eq $demoPort) { throw 'Ports 5180 and 5181 are used by other services. Close an old local server and retry.' }
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Install Node.js 24.22.1, then run this launcher again.' }
& $nodePath (Join-Path $PSScriptRoot 'check-node-version.mjs')
if ($LASTEXITCODE -ne 0) { throw 'This project requires Node.js 24.22.1 or a later 24.x release.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectWeb 'node_modules\vite\bin\vite.js'))) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check the network and retry.' }
}
Write-Host "Project: $projectWeb"
Write-Host "Opening http://127.0.0.1:$demoPort/ - keep this window open."
$viteArgs = @('node_modules/vite/bin/vite.js','--mode','demo','--host','127.0.0.1','--port',"$demoPort",'--strictPort')
if (-not $NoOpen) { $viteArgs += '--open' }
& $nodePath @viteArgs
exit $LASTEXITCODE
