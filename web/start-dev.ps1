# 一键启动前端演示
# 右键“使用 PowerShell 运行”，或在终端执行：.\start-dev.ps1
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "==> 项目目录: $PSScriptRoot"
if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
  Write-Host "==> 首次运行，安装依赖..."
  npm install
}

Write-Host "==> 启动公开课程演示环境 http://127.0.0.1:5180/"
Start-Process "http://127.0.0.1:5180/"
npm run dev:demo
