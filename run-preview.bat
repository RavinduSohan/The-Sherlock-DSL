@echo off
echo.
echo ========================================
echo   Sherlock Live Preview Server
echo ========================================
echo.
echo Starting preview server at http://localhost:3000
echo Browser will open automatically
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
node bin/sherlock.js preview --open

pause
