import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(repositoryRoot, 'web/dist/web/browser');
const indexPath = resolve(outputDirectory, 'index.html');
const version = process.env.CF_PAGES_COMMIT_SHA?.trim() || process.env.GITHUB_SHA?.trim() || 'local';

let index = await readFile(indexPath, 'utf8');
const meta = `<meta name="app-version" content="${version}">`;
index = index.includes('<meta name="app-version"')
  ? index.replace(/<meta name="app-version"[^>]*>/, meta)
  : index.replace('</head>', `  ${meta}\n</head>`);

await Promise.all([
  writeFile(indexPath, index),
  writeFile(resolve(outputDirectory, 'build-version.json'), `${JSON.stringify({ version })}\n`)
]);

console.log(`Build identificata come ${version}.`);
