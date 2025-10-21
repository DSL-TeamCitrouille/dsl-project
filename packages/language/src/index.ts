/**
 * CLI entry to parse & validate DAM files with optional "variant" constraints.
 * ESM-friendly (no `require.main`); works with `tsx`.
 */
import { NodeFileSystem } from 'langium/node';
import { URI, DocumentState, type AstNode, type LangiumDocument } from 'langium';
import { createDamDamServices } from './dam-dam-module.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export * from './dam-dam-module.js';
export * from './dam-dam-validator.js';
export * from './generated/ast.js';
export * from './generated/grammar.js';
export * from './generated/module.js';

type VariantName = 'default' | 'variant1';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) args[key] = true;
      else { args[key] = nxt; i++; }
    }
  }
  return args;
}

function validateVariantConstraints(root: any, variant: VariantName, errors: string[]) {
  if (variant === 'variant1') {
    const board = root?.board;
    if (!board) errors.push('variant1: Missing `board` section.');
    else {
      const w = Number(board.width); const h = Number(board.height);
      if (!(w === 8 && h === 8)) errors.push(`variant1: Board size must be 8 x 8 (got ${w} x ${h}).`);
    }
    if (root?.dice) errors.push('variant1: `dice` section is not allowed.');
    const pcs = root?.pieces?.pieces ?? root?.pieces?.piece ?? [];
    const names = new Set<string>(pcs.map((p: any)=>p.name));
    if (!names.has('blackToken') || !names.has('whiteToken'))
      errors.push('variant1: Must define `piece blackToken` and `piece whiteToken`.');
    for (const p of pcs) {
      if (p.name === 'blackToken' || p.name === 'whiteToken') {
        if (Number(p.quantity) !== 12) errors.push(`variant1: ${p.name} quantity must be 12.`);
      }
    }
    if (!root?.objective) errors.push('variant1: Missing `objective` section.');
  }
}

export async function runCli(): Promise<number> {
  const args = parseArgs(process.argv);
  const fileArg = (args.file || args.f) as string | undefined;
  const variant = ((args.variant as string) ?? 'default') as VariantName;

  if (!fileArg) { console.error('Usage: node dist/index.js --file path/to/model.dam [--variant variant1]'); return 2; }
  const filePath = path.resolve(String(fileArg));
  if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); return 2; }

  const services = createDamDamServices(NodeFileSystem);

  const documents = services.shared.workspace.LangiumDocuments;
  const doc: LangiumDocument<AstNode> = await documents.getOrCreateDocument(URI.file(filePath));

  await services.shared.workspace.DocumentBuilder.build([doc], { validation: true });
  const builder: any = services.shared.workspace.DocumentBuilder as any;
  if (builder?.waitUntil) {
    await builder.waitUntil(DocumentState.Validated, doc.uri);
  }

  const diagnostics = doc.diagnostics ?? [];
  const baseErrors = diagnostics.filter(d => d.severity === 1);
  const root = doc.parseResult?.value as AstNode & any;

  const variantErrors: string[] = [];
  validateVariantConstraints(root, variant, variantErrors);

  for (const d of diagnostics) {
    const pos = d.range ? `(${d.range.start.line + 1}:${d.range.start.character + 1})` : '';
    const sev = d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info';
    console.log(`${sev}: ${d.message} ${pos}`);
  }
  for (const m of variantErrors) console.log(`error[variant:${variant}]: ${m}`);

  if (baseErrors.length > 0 || variantErrors.length > 0) return 1;
  console.log(`OK: ${path.basename(filePath)} validated with variant="${variant}"`);
  return 0;
}

// ESM "is main" check
const isMain = pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  runCli().then(code => process.exit(code));
}
