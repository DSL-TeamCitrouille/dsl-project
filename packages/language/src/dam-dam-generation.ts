import * as fs from 'fs';
import * as cheerio from 'cheerio';

export interface GeneratorDiagnostic {
  message: string;
  severity: 'error' | 'warning' | 'ok';
}

export function validateGeneratedHTML(filePath: string): GeneratorDiagnostic[] {
  const diagnostics: GeneratorDiagnostic[] = [];

  if (!fs.existsSync(filePath)) {
    diagnostics.push({ severity: 'error', message: `File not found: ${filePath}` });
    return diagnostics;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const board = $('.board');
  if (board.length === 0) {
    diagnostics.push({ severity: 'error', message: 'The file does not contain a board (.board).' });
    return diagnostics;
  }

  const squares = $('.square');

  if (squares.length === 0) {
    diagnostics.push({ severity: 'error', message: 'No squares detected on the board.' });
  }

  const size = Math.sqrt(squares.length);
  if (!Number.isInteger(size)) {
    diagnostics.push({
      severity: 'error',
      message: `The number of squares (${squares.length}) does not correspond to a square grid.`
    });
  }

  // Check that there are no multiple pieces in a single square
  const squaresWithMultiplePieces = squares.filter((_, el) => $(el).find('.piece').length > 1);
  if (squaresWithMultiplePieces.length > 0) {
    diagnostics.push({
      severity: 'error',
      message: `Certain squares contain multiple pieces (${squaresWithMultiplePieces.length}).`
    });
  }

  // Check the dice if present
  const dice = $('.dice');
  if (dice.length > 0 && $('.throw-button').length === 0) {
    diagnostics.push({
      severity: 'warning',
      message: 'A dice is present, but no "Throw Dice" button was found.'
    });
  }

  // If no issues → success
  if (diagnostics.length === 0) {
    diagnostics.push({ severity: 'ok', message: '✅ Valid HTML file.' });
  }

  return diagnostics;
}
