// npx tsx packages/language/src/test/generation-test.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateGeneratedHTML } from '../dam-dam-generation.js';

// Recréation de __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier où sont générés les fichiers HTML
const outDir = path.resolve(__dirname, '../outputGenerator');

// Vérifie qu'il existe
if (!fs.existsSync(outDir)) {
  console.error(`❌ Output directory not found: ${outDir}`);
  process.exit(1);
}

// Liste tous les fichiers HTML
const htmlFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.html'));

if (htmlFiles.length === 0) {
  console.log('⚠️  No generated HTML files found in:', outDir);
  process.exit(0);
}

console.log(`🧩 Running generator validation on ${htmlFiles.length} file(s)...\n`);

for (const file of htmlFiles) {
  const filePath = path.join(outDir, file);
  const diagnostics = validateGeneratedHTML(filePath);

  for (const diag of diagnostics) {
    const prefix = diag.severity === 'ok'
      ? '✅'
      : diag.severity === 'warning'
      ? '⚠️'
      : '❌';

    console.log(`${prefix} [${diag.severity.toUpperCase()}] ${file}: ${diag.message}`);
  }

  console.log('—'.repeat(80));
}
