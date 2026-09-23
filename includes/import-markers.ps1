$ErrorActionPreference = "Stop"

$includesFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$importFolder = Join-Path $includesFolder "markerimport"
$targetFile = Join-Path $includesFolder "marker-data.json"

if (-not (Test-Path $targetFile)) {
    "[]" | Set-Content -Path $targetFile -Encoding UTF8
}

try {
    $existingMarkers = @(Get-Content -Raw -Path $targetFile | ConvertFrom-Json)
} catch {
    throw "Die Zieldatei marker-data.json enthält kein gültiges JSON."
}

$markersById = @{}
foreach ($marker in $existingMarkers) {
    if ($marker.id) {
        $markersById[[string]$marker.id] = $marker
    }
}

$importFiles = @(Get-ChildItem -Path $importFolder -Filter "*.json" -File)
if ($importFiles.Count -eq 0) {
    Write-Host "Keine JSON-Dateien in markerimport gefunden."
    exit 0
}

foreach ($file in $importFiles) {
    try {
        $importedMarkers = @(Get-Content -Raw -Path $file.FullName | ConvertFrom-Json)
        foreach ($marker in $importedMarkers) {
            if (-not $marker.id) {
                throw "Marker ohne id"
            }
            $markersById[[string]$marker.id] = $marker
        }

        Remove-Item -LiteralPath $file.FullName -Force
        Write-Host "Verarbeitet und geloescht: $($file.Name)"
    } catch {
        Write-Warning "Uebersprungen: $($file.Name) - $($_.Exception.Message)"
    }
}

@($markersById.Values) | ConvertTo-Json -Depth 10 | Set-Content -Path $targetFile -Encoding UTF8
Write-Host "Markerdatei aktualisiert: $targetFile"
