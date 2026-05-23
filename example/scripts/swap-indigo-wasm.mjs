/**
 * Swaps node_modules/indigo-ketcher between the local WASM build and the npm package.
 *
 * Usage:
 *   node scripts/swap-indigo-wasm.mjs local  — install local Indigo WASM build
 *   node scripts/swap-indigo-wasm.mjs npm    — restore vendored npm package
 *
 * The local build directory is read from LOCAL_INDIGO_WASM_PATH in ../.env
 * (relative to the example/ directory).
 */

import { readFileSync, existsSync, readdirSync, copyFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_DIR = resolve(__dirname, '..');
const INDIGO_NM = resolve(EXAMPLE_DIR, '../node_modules/indigo-ketcher');
const INDIGO_NM_BACKUP = resolve(EXAMPLE_DIR, '../node_modules/indigo-ketcher-npm-backup');

function loadEnv() {
  const envPath = resolve(EXAMPLE_DIR, '.env');
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const file of readdirSync(src)) {
    copyFileSync(resolve(src, file), resolve(dest, file));
  }
}

const mode = process.argv[2];
if (mode !== 'local' && mode !== 'npm') {
  console.error('Usage: node swap-indigo-wasm.mjs <local|npm>');
  process.exit(1);
}

if (mode === 'local') {
  const env = loadEnv();
  const wasmPath = env.LOCAL_INDIGO_WASM_PATH;
  if (!wasmPath) {
    console.error('Error: LOCAL_INDIGO_WASM_PATH is not set in example/.env');
    console.error('Set it to the directory containing your locally-built indigo-ketcher.js');
    process.exit(1);
  }
  const localBuildDir = resolve(EXAMPLE_DIR, wasmPath);
  const localJs = resolve(localBuildDir, 'indigo-ketcher.js');
  if (!existsSync(localJs)) {
    console.error(`Error: ${localJs} not found.`);
    console.error('Build the local Indigo WASM first (see INDIGO_INTEGRATION.md).');
    process.exit(1);
  }

  // Check if already using local build (has marker file)
  if (existsSync(resolve(INDIGO_NM, '.local-wasm-marker'))) {
    console.log('Already using local Indigo WASM — skipping swap.');
    process.exit(0);
  }

  // Back up npm package if not already backed up
  if (!existsSync(INDIGO_NM_BACKUP) && existsSync(INDIGO_NM)) {
    console.log('Backing up node_modules/indigo-ketcher → indigo-ketcher-npm-backup');
    copyDir(INDIGO_NM, INDIGO_NM_BACKUP);
    rmSync(INDIGO_NM, { recursive: true });
  } else if (existsSync(INDIGO_NM)) {
    rmSync(INDIGO_NM, { recursive: true });
  }

  console.log(`Installing local Indigo WASM from: ${localBuildDir}`);
  copyDir(localBuildDir, INDIGO_NM);

  // Write marker so we can detect the swap
  const { writeFileSync } = await import('fs');
  writeFileSync(resolve(INDIGO_NM, '.local-wasm-marker'), localBuildDir);
  console.log('Done. node_modules/indigo-ketcher now points to local build.');
  console.log('Run "npm run use-npm-wasm" to restore the vendored package.');

} else {
  // Restore npm backup
  if (!existsSync(INDIGO_NM_BACKUP)) {
    console.log('No npm backup found — nothing to restore.');
    process.exit(0);
  }
  if (existsSync(INDIGO_NM)) {
    rmSync(INDIGO_NM, { recursive: true });
  }
  console.log('Restoring vendored indigo-ketcher from backup...');
  copyDir(INDIGO_NM_BACKUP, INDIGO_NM);
  rmSync(INDIGO_NM_BACKUP, { recursive: true });
  console.log('Done. node_modules/indigo-ketcher restored to npm package.');
}
