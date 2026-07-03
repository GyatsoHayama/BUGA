#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lese alle Dateien im aktuellen Verzeichnis
const currentDir = __dirname;
const files = fs.readdirSync(currentDir);

// Filtere nur .md-Dateien und sortiere sie
const mdFiles = files
    .filter(file => file.endsWith('.md'))
    .sort();

// Schreibe die JSON-Datei
const outputPath = path.join(currentDir, 'protocols.json');
fs.writeFileSync(outputPath, JSON.stringify(mdFiles, null, 2) + '\n');

console.log(`✓ protocols.json aktualisiert mit ${mdFiles.length} Dateien:`);
mdFiles.forEach(file => console.log(`  - ${file}`));
