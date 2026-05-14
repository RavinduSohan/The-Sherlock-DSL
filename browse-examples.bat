@echo off
echo.
echo ========================================
echo   Sherlock CLI - Browse Examples
echo ========================================
echo.

cd /d "%~dp0"
node bin/sherlock.js examples

echo.
echo To preview an example, use:
echo   preview-scene.bat "scenes\SCENE_NAME.sherlock"
echo.
pause
