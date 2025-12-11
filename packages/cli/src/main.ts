import type { Damier } from 'dam-dam-language';
import { createDamDamServices, DamDamLanguageMetaData } from 'dam-dam-language';
import chalk from 'chalk';
import { Command } from 'commander';
import { extractAstNode } from './util.js';
import { generateOutput } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { runHeadless } from './headless.js';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (source: string, destination: string, options: any): Promise<void> => {
  const services = createDamDamServices(NodeFileSystem).DamDam;
  const model = await extractAstNode<Damier>(source, services);
  
  // Parse options
  const seed = options.seed ? parseInt(options.seed) : Date.now();
  const headless = options.headless ? parseInt(options.headless) : 0;
  const botDifficulty = options.botDifficulty || 'random';
  
  // Always generate the playable HTML
  const generatedFilePath = await generateOutput(model, source, destination, options);
  console.log(chalk.green(`Code generated successfully: ${generatedFilePath}`));
  
  // If headless mode is enabled, run simulation
  if (headless === 1) {
    console.log(chalk.yellow('\n🎮 Running headless simulation...'));
    
    const outputDir = path.dirname(destination);
    const nextStatePath = path.join(outputDir, 'next_state.json');
    
    // Parse firstPlayer option if provided
    let firstPlayerIndex = 0;
    if (options.firstPlayer) {
      const fp = options.firstPlayer.toString().toLowerCase().trim();
      if (/^[0-9]+$/.test(fp)) {
        const n = parseInt(fp) - 1;
        firstPlayerIndex = n >= 0 && n < model.pieces.piece.length ? n : 0;
      } else {
        const idx = model.pieces.piece.findIndex((p: any) =>
          p.name?.toLowerCase() === fp || p.color?.toLowerCase() === fp
        );
        firstPlayerIndex = idx >= 0 ? idx : 0;
      }
    }
    
    const mandatoryCapture = options.mandatoryCapture === 'true';
    
    await runHeadless(model, {
      ai: botDifficulty, // botDifficulty as ai parameter
      seed,
      numMoves: 10, // Simulate 10 moves by default
      outputPath: nextStatePath,
      firstPlayer: firstPlayerIndex,
      mandatoryCapture
    });
  }
};

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    // TODO: use Program API to declare the CLI
    const fileExtensions = DamDamLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<destination>', 'destination file')
        .description('Generates code for a provided source file.')
        // Options : variability CT
        .option('--firstPlayer <player>', 'Override first player (e.g., white, black or 1, 2)')
        .option('--mandatoryCapture <bool>', 'Override mandatory capture (true/false)')
        .option('--message <text>', 'Override capture message')
        .option('--moveBackward <bool>', 'Override backward movement (true/false)')
        .option('--botDifficulty <text>', 'Override bot difficulty (e.g., random, greedy or heuristic)')
        .option('--seed <number>', 'Random seed for reproducibility')
        .option('--headless <number>', 'Headless mode: 0=disabled, 1=enabled (outputs next_state.json)')
        .action(generateAction);

    program.parse(process.argv);
}
