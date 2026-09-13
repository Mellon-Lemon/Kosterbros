process.env.NODE_ENV = 'production';
const { createBuilder } = await import('vite');
const { runPrerender } = await import('vinext/internal/build/run-prerender');
const { emitPrerenderPathManifest } = await import('vinext/internal/build/prerender-paths');
import { rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist')
  throw new Error('Invalid build directory');
await rm(output, { recursive: true, force: true });
// Use the framework build APIs so native workers can close naturally on Windows.
// The CLI calls process.exit immediately, which aborts Node 24's native async cleanup.
await (await createBuilder({ root, logLevel: 'error' })).buildApp();
await runPrerender({ root });
await emitPrerenderPathManifest({ root });
const html = await readFile(path.join(output, 'client/index.html'), 'utf8');
if (!html.includes('KOSTER')) throw new Error('Static game export is missing');
console.log('KosterBro’s build gereed: dist/client');
