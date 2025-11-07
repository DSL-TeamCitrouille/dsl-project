import type { Damier} from 'dam-dam-language';
import * as fs from 'node:fs';
import { extractDestinationAndName } from './util.js';
import { generateBundledHTML } from './htmlGeneratorBundled.js';

/**
 * Generates HTML board visualization from the Damier (game) model
 */
export function generateOutput(
  model: Damier,
  source: string,
  destination: string
): string {
  const data = extractDestinationAndName(destination);

  const htmlContent = generateBundledHTML(model);

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }

  fs.writeFileSync(destination, htmlContent);
  return destination;
}