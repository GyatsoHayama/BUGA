param(
    [string]$ImportFolder,
    [string]$MarkerDataPath,
    [string]$PoiDataPath
)

$ErrorActionPreference = "Stop"

$includesFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $includesFolder
if (-not $ImportFolder) { $ImportFolder = Join-Path $includesFolder "markerimport" }
if (-not $MarkerDataPath) { $MarkerDataPath = Join-Path $includesFolder "marker-data.json" }
if (-not $PoiDataPath) { $PoiDataPath = Join-Path $projectRoot "POI\POI2\pois.json" }

function Read-JsonItems {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) { return @() }
    $data = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
    if ($data -is [System.Array]) { return $data }
    if ($data -and $data.value -is [System.Array]) { return $data.value }
    if ($null -ne $data) { return @($data) }
    return @()
}

function Add-ImportedMarker {
    param(
        [object]$Marker,
        [hashtable]$MarkersById,
        [hashtable]$PoisById
    )

    if (-not $Marker.id) { throw "Marker ohne id" }
    $applicationType = [string]$Marker.applicationType
    if (-not $applicationType) {
        switch ([string]$Marker.applicationUrl) {
            "POI/skl_POI.html" { $applicationType = "poi" }
            "POI/POI2/index.html" { $applicationType = "poi" }
            "Murals/skl_Murals_Marcel.html" { $applicationType = "murals" }
            "A-Frame/skl_Marker_L.html" { $applicationType = "marker" }
            "A-Frame/skl_index.html" { $applicationType = "marker" }
            default { $applicationType = "individual" }
        }
    }

    if ($applicationType -eq "poi") {
        if ($Marker.type -eq "area") { throw "POI-Anwendung unterstützt keine Arealrechtecke" }
        $poiName = if ($Marker.title) { [string]$Marker.title } else { [string]$Marker.name }
        $poiCategory = if ($Marker.category) { [string]$Marker.category } else { "poi" }
        $poiIcon = if ($Marker.icon) { [string]$Marker.icon } else { "default" }
        $poi = [pscustomobject]@{
            id = [string]$Marker.id
            name = $poiName
            latitude = $Marker.latitude
            longitude = $Marker.longitude
            category = $poiCategory
            description = [string]$Marker.description
            icon = $poiIcon
            applicationUrl = "POI/skl_POI.html"
        }
        $PoisById[[string]$Marker.id] = $poi
        return
    }

    if ($applicationType -eq "murals") {
        if ($Marker.type -eq "area") { throw "Murals unterstützt keine Arealrechtecke" }
        $Marker.applicationUrl = "Murals/skl_Murals_Marcel.html"
    } elseif ($applicationType -eq "marker") {
        if ($Marker.type -eq "area") { throw "Die A-Frame-Marker-Anwendung unterstützt keine Arealrechtecke" }
        $Marker.applicationUrl = "A-Frame/skl_Marker_L.html"
    } elseif ($applicationType -ne "individual") {
        throw "Unbekannte Anwendung: $applicationType"
    }

    if (-not $Marker.PSObject.Properties["applicationType"]) {
        $Marker | Add-Member -NotePropertyName applicationType -NotePropertyValue $applicationType
    } else {
        $Marker.applicationType = $applicationType
    }
    $MarkersById[[string]$Marker.id] = $Marker
}

function Write-JsonArray {
    param([string]$Path, [object[]]$Items)

    $json = ConvertTo-Json -InputObject @($Items) -Depth 20
    [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
}

$markersById = @{}
$poisById = @{}
foreach ($marker in @(Read-JsonItems -Path $MarkerDataPath)) {
    if ($marker.id) { Add-ImportedMarker -Marker $marker -MarkersById $markersById -PoisById $poisById }
}
foreach ($poi in @(Read-JsonItems -Path $PoiDataPath)) {
    if ($poi.id) { $poisById[[string]$poi.id] = $poi }
}

$importFiles = @(Get-ChildItem -Path $ImportFolder -Filter "*.json" -File)
if ($importFiles.Count -eq 0) {
    Write-Host "Keine JSON-Dateien in markerimport gefunden."
    exit 0
}

foreach ($file in $importFiles) {
    try {
        foreach ($marker in @(Read-JsonItems -Path $file.FullName)) {
            Add-ImportedMarker -Marker $marker -MarkersById $markersById -PoisById $poisById
        }

        Remove-Item -LiteralPath $file.FullName -Force
        Write-Host "Verarbeitet und geloescht: $($file.Name)"
    } catch {
        Write-Warning "Uebersprungen: $($file.Name) - $($_.Exception.Message)"
    }
}

Write-JsonArray -Path $MarkerDataPath -Items @($markersById.Values)
Write-JsonArray -Path $PoiDataPath -Items @($poisById.Values)
Write-Host "Markerdatei aktualisiert: $MarkerDataPath"
Write-Host "POI-Datei aktualisiert: $PoiDataPath"
