@echo off
REM Live coding mode - watch a scene file and auto-refresh

if "%1"=="" (
    echo Usage: live-code.bat "path\to\scene.sherlock"
    echo Example: live-code.bat "scenes\hope 2.sherlock"
    pause
    exit /b 1
)

cd /d "%~dp0"
node bin/sherlock.js code "%~1"
