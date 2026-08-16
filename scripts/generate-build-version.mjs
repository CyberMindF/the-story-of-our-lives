import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist/web/browser');
const version =
  process.env.CF_PAGES_COMMIT_SHA?.trim()
  || process.env.GITHUB_SHA?.trim()
  || `local-${Date.now()}`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'version.json'),
  `${JSON.stringify({ version })}\n`,
  'utf8'
);
