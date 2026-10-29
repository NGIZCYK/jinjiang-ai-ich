@echo off
setlocal EnableExtensions
title Jinjiang Su Embroidery - Local Server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-demo.ps1"
if errorlevel 1 pause
exit /b %ERRORLEVEL%
