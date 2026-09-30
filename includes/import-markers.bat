@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0import-markers.ps1"
if errorlevel 1 (
    echo Import fehlgeschlagen.
    pause
    exit /b 1
)

echo Import abgeschlossen.
echo Individuelle, Murals- und A-Frame-Punkte: includes\marker-data.json
echo POI-Anwendung: POI\POI2\pois.json
pause
