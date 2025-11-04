// packages/language/src/dam-dam-generator.ts
import * as fs from 'fs';
import * as cheerio from 'cheerio'; // pour analyser le HTML

export interface GeneratorDiagnostic {
  message: string;
  severity: 'error' | 'warning' | 'ok';
}

/**
 * Vérifie qu’un fichier HTML généré respecte les règles attendues
 */
export function validateGeneratedHTML(filePath: string): GeneratorDiagnostic[] {
  const diagnostics: GeneratorDiagnostic[] = [];

  if (!fs.existsSync(filePath)) {
    diagnostics.push({ severity: 'error', message: `Fichier introuvable: ${filePath}` });
    return diagnostics;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const board = $('.board');
  if (board.length === 0) {
    diagnostics.push({ severity: 'error', message: 'Le fichier ne contient pas de plateau (.board).' });
    return diagnostics;
  }

  const squares = $('.square');

  if (squares.length === 0) {
    diagnostics.push({ severity: 'error', message: 'Aucune case détectée dans le plateau.' });
  }

  const size = Math.sqrt(squares.length);
  if (!Number.isInteger(size)) {
    diagnostics.push({
      severity: 'error',
      message: `Le nombre de cases (${squares.length}) ne correspond pas à une grille carrée.`
    });
  }

  // Vérifie qu’il n’y a pas de double pièce dans une case
  const squaresWithMultiplePieces = squares.filter((_, el) => $(el).find('.piece').length > 1);
  if (squaresWithMultiplePieces.length > 0) {
    diagnostics.push({
      severity: 'error',
      message: `Certaines cases contiennent plusieurs pièces (${squaresWithMultiplePieces.length}).`
    });
  }

  // Vérifie le dé si présent
  const dice = $('.dice');
  if (dice.length > 0 && $('.throw-button').length === 0) {
    diagnostics.push({
      severity: 'warning',
      message: 'Un dé est présent, mais aucun bouton "Throw Dice" trouvé.'
    });
  }

  // Si aucun problème → success
  if (diagnostics.length === 0) {
    diagnostics.push({ severity: 'ok', message: '✅ Fichier HTML valide.' });
  }

  return diagnostics;
}
