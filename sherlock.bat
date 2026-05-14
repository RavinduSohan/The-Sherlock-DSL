@echo off
REM Sherlock CLI Wrapper for Windows

cd /d "%~dp0"
node bin/sherlock.js %*
