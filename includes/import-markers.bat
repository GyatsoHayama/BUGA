@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0import-markers.ps1"
if errorlevel 1 (
    echo Import fehlgeschlagen.
    pause
    exit /b 1
)

echo Import abgeschlossen.
pause
