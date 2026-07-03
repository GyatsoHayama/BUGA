# Protokoll-Verwaltung

## Automatische Aktualisierung der Protokollliste

Die `protocols.json` wird automatisch durch das Skript `update-protocols.ps1` generiert.

### Neue Protokolle hinzufügen

1. Speichere die neue `.md`-Datei im `Sitzungsprotokolle/`-Verzeichnis
2. Führe folgendes Kommando aus:

```powershell
powershell -ExecutionPolicy Bypass -File update-protocols.ps1
```

Alternativ in der PowerShell direkt im Verzeichnis:
```powershell
./update-protocols.ps1
```

Das Skript:
- Findet automatisch alle `.md`-Dateien
- Sortiert sie alphabetisch
- Aktualisiert die `protocols.json`
- Zeigt eine Liste aller gefundenen Dateien an

### Manuell aktualisieren

Falls du möchtest, kannst du auch die `protocols.json` manuell bearbeiten. Sie muss ein JSON-Array mit den Dateinamen sein:

```json
[
  "260407_Sitzung_1.md",
  "260414_Sitzung_2.md"
]
```

Die Protokoll.html-Seite lädt diese Liste automatisch und zeigt sie im Dropdown-Menü an.
