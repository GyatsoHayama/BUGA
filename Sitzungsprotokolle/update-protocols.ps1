# PowerShell-Skript zum automatischen Aktualisieren der protocols.json

param(
    [string]$Path = $PSScriptRoot
)

# Finde alle .md-Dateien im Verzeichnis und sortiere sie
$mdFiles = Get-ChildItem -Path $Path -Filter "*.md" -File | Sort-Object Name | Select-Object -ExpandProperty Name

# Konvertiere zu JSON
$json = $mdFiles | ConvertTo-Json

# Schreibe die Datei
$outputPath = Join-Path $Path "protocols.json"
Set-Content -Path $outputPath -Value $json -Encoding UTF8

Write-Host "X protocols.json aktualisiert mit $($mdFiles.Count) Dateien:"
$mdFiles | ForEach-Object { Write-Host "  - $_" }
