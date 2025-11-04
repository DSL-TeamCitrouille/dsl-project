// npx tsx packages/language/src/test/validation-test.ts

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { createDamDamServices } from '../dam-dam-module.js';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import type { Damier } from '../generated/ast.js';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const examplesDir = path.resolve(__dirname, '../examples');

function getDamFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getDamFiles(fullPath));
        } else if (entry.isFile() && fullPath.endsWith('.dam')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function validateFile(file: string, parse: (input: string, options?: any) => Promise<any>) {
    const content = fs.readFileSync(file, 'utf-8');
    const document = await parse(content, { validation: true });

    const diagnostics = document.diagnostics ?? [];

    if (diagnostics.length === 0) {
        console.log(chalk.green(`✅ ${path.basename(file)} — OK`));
        return true;
    }

    console.log(chalk.red(`❌ ${path.basename(file)} — ${diagnostics.length} issues found:`));
    for (const diag of diagnostics) {
        const severity = diag.severity === 1 ? chalk.red('Error') : chalk.yellow('Warning');
        console.log(`   ${severity}: ${diag.message}`);
    }

    return false;
}

async function main() {
    const files = getDamFiles(examplesDir);
    if (files.length === 0) {
        console.log(chalk.yellow('No .dam files found.'));
        return;
    }

    console.log(chalk.blueBright(`🧩 Validating ${files.length} .dam files...\n`));

    const services = createDamDamServices(EmptyFileSystem);
    const parse = parseHelper<Damier>(services.DamDam);

    let ok = 0;
    let failed = 0;

    for (const file of files) {
        const success = await validateFile(file, parse);
        success ? ok++ : failed++;
    }

    console.log('\n📊 Résumé :');
    console.log(chalk.green(`   ✅ Valid: ${ok}`));
    console.log(chalk.red(`   ❌ Invalid: ${failed}`));
}

main().catch(err => {
    console.error(chalk.red('Unexpected error:'), err);
});
