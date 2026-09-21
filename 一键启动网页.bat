@echo off
setlocal
title Jinjiang Suzhou ICH Website Launcher

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0web\start-preview.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] The website could not be started.
  echo See web\vite-err.log for details, or send a screenshot of this window.
  pause
  exit /b 1
)

exit /b 0
