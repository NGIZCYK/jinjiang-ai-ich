@echo off
setlocal EnableExtensions
title Jinjiang Su Embroidery - Local Server

cd /d "%~dp0web"
if errorlevel 1 goto directory_missing

REM If the local service is already running, simply open the home page.
netstat -ano | findstr /R /C:":5181 .*LISTENING" >nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:5181/"
  echo The website is already running on port 5181.
  timeout /t 2 /nobreak >nul
  exit /b 0
)

REM Prefer the Node runtime bundled with Codex; otherwise use system Node.js.
set "NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE%" goto node_ready

where node >nul 2>nul
if errorlevel 1 goto node_missing
set "NODE=node"

:node_ready
if exist "node_modules\vite\bin\vite.js" goto start_server

echo Installing frontend dependencies for the first run...
where npm >nul 2>nul
if errorlevel 1 goto npm_missing
call npm install
if errorlevel 1 goto install_failed

:start_server
echo Starting the website. Keep this window open while using the site.
REM Vite opens the browser itself after the local server is ready.
"%NODE%" "node_modules\vite\bin\vite.js" --mode demo --host 127.0.0.1 --port 5181 --strictPort --open
set "RESULT=%ERRORLEVEL%"
echo.
echo The website server stopped. Error code: %RESULT%
pause
exit /b %RESULT%

:directory_missing
echo Could not enter the web folder. Keep this file in the project root folder.
pause
exit /b 1

:node_missing
echo Node.js was not found. Install Node.js LTS and run this file again.
pause
exit /b 1

:npm_missing
echo npm was not found, so dependencies cannot be installed automatically.
pause
exit /b 1

:install_failed
echo Dependency installation failed. Check your network and try again.
pause
exit /b 1
