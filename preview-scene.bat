@echo off
REM Quick batch file to preview a specific scene

if "%1"=="" (
    echo Usage: preview-scene.bat "path\to\scene.sherlock"
    echo Example: preview-scene.bat "scenes\hope 2.sherlock"
    pause
    exit /b 1
)

cd /d "%~dp0"
node bin/sherlock.js preview "%~1" --open
