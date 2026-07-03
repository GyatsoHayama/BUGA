const fs = require('fs');
const path = require('path');

const protocolsDir = path.join(__dirname, '..', 'Sitzungsprotokolle');
const outputPath = path.join(protocolsDir, 'protocols.json');

const files = fs.readdirSync(protocolsDir)
  .filter(file => file.toLowerCase().endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'de'));

fs.writeFileSync(outputPath, JSON.stringify(files, null, 2) + '\n', 'utf8');
console.log(`Wrote ${files.length} protocol filenames to ${outputPath}`);
