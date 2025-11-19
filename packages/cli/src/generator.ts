// packages/cli/src/generator.ts
import type { Damier } from 'dam-dam-language';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { extractDestinationAndName } from './util.js';
import { generateHTML } from './htmlGeneratorPlayable.js';

export async function generateOutput(
  model: Damier,
  source: string,
  destination: string
): Promise<string> {
  const data = extractDestinationAndName(destination);
  let htmlContent = generateHTML(model);

  // Créer le dossier de destination si nécessaire
  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }

  // Trouver main.js compilé
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const mainJsPath = path.resolve(__dirname, '../out/scripts/app.js');

  if (!fs.existsSync(mainJsPath)) {
    console.warn('⚠️ main.js introuvable. Lance `npm run build` d\'abord.');
    fs.writeFileSync(destination, htmlContent, { encoding: 'utf8' });
    return destination;
  }

  try {
    // Bundle et inline
    const result = await esbuild.build({
      entryPoints: [mainJsPath],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
    });

    const bundledJS = result.outputFiles[0].text;

    // Remplacer le script module par le bundle inline
    htmlContent = htmlContent.replace(
      /<script type="module" src="\.\/app\.js"><\/script>/,
      `<script>\n${bundledJS}\n</script>`
    );

    console.log('✅ Scripts injectés dans le HTML');
  } catch (error) {
    console.error('❌ Erreur bundling:', error);
  }

  fs.writeFileSync(destination, htmlContent, { encoding: 'utf8' });
  return destination;
}