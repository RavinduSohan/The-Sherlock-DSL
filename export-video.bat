@echo off
REM Export a scene to video

if "%1"=="" (
    echo Usage: export-video.bat "path\to\scene.sherlock" "output.mp4"
    echo Example: export-video.bat "scenes\hope 2.sherlock" "my-video.mp4"
    pause
    exit /b 1
)

set OUTPUT=%2
if "%OUTPUT%"=="" set OUTPUT=output\%~n1.mp4

cd /d "%~dp0"
if not exist "output" mkdir "output"
node bin/sherlock.js render "%~1" --output "%OUTPUT%" --fps 60 --quality 18

pause
