@echo off
echo.
echo ========================================
echo   Sherlock Interactive Mode
echo ========================================
echo.
echo Launching interactive TUI...
echo.

cd /d "%~dp0"
node bin/sherlock.js interactive

pause
