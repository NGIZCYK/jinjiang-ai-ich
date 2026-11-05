@echo off
setlocal EnableExtensions
title Jinjiang Su Embroidery - Local Stays
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-stays.ps1" -OpenHome %*
if errorlevel 1 pause
exit /b %ERRORLEVEL%
