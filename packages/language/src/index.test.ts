import { describe, it, expect } from 'vitest';
import { createDamDamServices } from "./dam-dam-module.js";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import { Damier } from "./generated/ast.js";
import { readFileSync } from 'fs';
import { resolve } from 'path';

const services = createDamDamServices(EmptyFileSystem);
const parse = parseHelper<Damier>(services.DamDam);

function readDamFile(filename: string): string {
  return readFileSync(resolve(__dirname, filename), 'utf-8');
}

function validateVariant1(model: Damier): string[] {
  const errors: string[] = [];
  const board = model?.board;
  
  if (!board) errors.push('Missing board section');
  else if (board.width !== 8 || board.height !== 8) {
    errors.push(`Board must be 8x8 (got ${board.width}x${board.height})`);
  }
  
  if (model?.dice) errors.push('Dice section not allowed');
  
  const pieces = model?.pieces?.piece ?? [];
  const names = new Set(pieces.map(p => p.name));
  if (!names.has('blackToken') || !names.has('whiteToken')) {
    errors.push('Must have blackToken and whiteToken');
  }
  
  pieces.forEach(p => {
    if ((p.name === 'blackToken' || p.name === 'whiteToken') && p.quantity !== 12) {
      errors.push(`${p.name} must have quantity 12`);
    }
  });
  
  if (!model?.objective) errors.push('Missing objective section');
  
  return errors;
}

describe('DamDam Parser', () => {
  
  it('parses variant1.dam correctly', async () => {
    const doc = await parse(readDamFile('examples/variant1.dam'));
    const model = doc.parseResult.value;
    
    expect(model.name).toBe("ClassicCheckers");
    expect(model.board?.width).toBe(8);
    expect(model.board?.height).toBe(8);
    expect(model.pieces?.piece).toHaveLength(2);
    expect(model.dice).toBeUndefined();
    expect(doc.diagnostics ?? []).toHaveLength(0);
    expect(validateVariant1(model)).toHaveLength(0);
  });

//   it('detects board size violations', async () => {
//     const doc = await parse(readDamFile('test-cases/invalid-board.dam'));
//     const errors = validateVariant1(doc.parseResult.value);
    
//     expect(errors.some(e => e.includes('8x8'))).toBe(true);
//   });

//   it('detects dice violations', async () => {
//     const doc = await parse(readDamFile('test-cases/game-with-dice.dam'));
//     const errors = validateVariant1(doc.parseResult.value);
    
//     expect(errors.some(e => e.includes('Dice'))).toBe(true);
//   });

//   it('detects quantity violations', async () => {
//     const doc = await parse(readDamFile('test-cases/wrong-quantities.dam'));
//     const errors = validateVariant1(doc.parseResult.value);
    
//     expect(errors.some(e => e.includes('quantity 12'))).toBe(true);
//   });

//   it('detects missing sections', async () => {
//     const doc = await parse(readDamFile('test-cases/incomplete-game.dam'));
    
//     expect((doc.diagnostics ?? []).length).toBeGreaterThan(0);
//   });

//   it('handles syntax errors', async () => {
//     const doc = await parse(readDamFile('test-cases/invalid-syntax.dam'));
    
//     expect((doc.diagnostics ?? []).length).toBeGreaterThan(0);
//   });
});
