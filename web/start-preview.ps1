# 生产预览一键启动：校验版本、处理本项目旧进程、构建并后台启动。
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$expectedApiVersion = '2026.09.15-guide-v2'
$previewUrl = 'http://127.0.0.1:5181/'
$capabilitiesUrl = "${previewUrl}api/capabilities"
$outputLog = Join-Path $PSScriptRoot 'vite-out.log'
$errorLog = Join-Path $PSScriptRoot 'vite-err.log'

function Get-PreviewCapabilities {
  try {
    return Invoke-RestMethod -Uri $capabilitiesUrl -Method Get -TimeoutSec 2 -Headers @{ Accept = 'application/json' }
  } catch {
    return $null
  }
}

function Get-PortListener {
  try {
    return Get-NetTCPConnection -LocalPort 5181 -State Listen -ErrorAction Stop | Select-Object -First 1
  } catch {
    return $null
  }
}

$currentCapabilities = Get-PreviewCapabilities
if ($currentCapabilities -and $currentCapabilities.apiVersion -eq $expectedApiVersion) {
  if (-not $NoBrowser) { Start-Process $previewUrl }
  Write-Host 'The latest preview is already running.'
  exit 0
}

$listener = Get-PortListener
if ($listener) {
  $listenerProcessId = [int]$listener.OwningProcess
  $listenerProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $listenerProcessId" -ErrorAction SilentlyContinue
  $commandLine = [string]$listenerProcess.CommandLine
  $resolvedProjectPath = [IO.Path]::GetFullPath($PSScriptRoot)
  $isThisProjectVite = $commandLine.Contains($resolvedProjectPath, [StringComparison]::OrdinalIgnoreCase) -and $commandLine -match 'vite'

  if (-not $isThisProjectVite) {
    throw "Port 5181 is occupied by another program (process $listenerProcessId). Close it and try again."
  }

  Write-Host 'Stopping the outdated preview for this project...'
  Stop-Process -Id $listenerProcessId -Force
  $deadline = (Get-Date).AddSeconds(6)
  while ((Get-PortListener) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
  }
  if (Get-PortListener) {
    throw 'The outdated preview did not release port 5181.'
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'))) {
  Write-Host 'Installing dependencies for the first run...'
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}

Write-Host 'Building the latest production version...'
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }

Remove-Item -LiteralPath $outputLog, $errorLog -Force -ErrorAction SilentlyContinue
$npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source
$previewProcess = Start-Process `
  -FilePath $npmPath `
  -ArgumentList @('run', 'preview', '--', '--host', '127.0.0.1', '--port', '5181', '--strictPort') `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $outputLog `
  -RedirectStandardError $errorLog `
  -PassThru

$readyDeadline = (Get-Date).AddSeconds(20)
do {
  Start-Sleep -Milliseconds 350
  if ($previewProcess.HasExited) {
    $details = if (Test-Path -LiteralPath $errorLog) { Get-Content -Raw -LiteralPath $errorLog } else { '' }
    throw "Preview exited before it was ready. $details"
  }
  $currentCapabilities = Get-PreviewCapabilities
} while ((-not $currentCapabilities -or $currentCapabilities.apiVersion -ne $expectedApiVersion) -and (Get-Date) -lt $readyDeadline)

if (-not $currentCapabilities -or $currentCapabilities.apiVersion -ne $expectedApiVersion) {
  Stop-Process -Id $previewProcess.Id -Force -ErrorAction SilentlyContinue
  throw 'Preview started but did not pass the API version check.'
}

if (-not $NoBrowser) { Start-Process $previewUrl }
Write-Host "Preview ready: $previewUrl"
Write-Host 'The server is running in the background. Run this launcher again to reopen the page.'
