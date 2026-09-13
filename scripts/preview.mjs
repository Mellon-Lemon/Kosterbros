/** Serve the static Netlify output locally, without framework/server bindings. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/client',
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.rsc': 'text/x-component',
  '.woff2': 'font/woff2',
};
try {
  await stat(path.join(root, 'index.html'));
} catch {
  console.error('Bouw eerst de game met npm run build.');
  process.exit(1);
}
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      res.end();
      return;
    }
    const requestPath = decodeURIComponent(
      new URL(req.url || '/', 'http://localhost').pathname,
    );
    let file = path.resolve(root, '.' + requestPath);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory())
        file = path.join(file, 'index.html');
      await stat(file);
    } catch {
      if (path.extname(requestPath) && !requestPath.endsWith('.html')) {
        res.writeHead(404);
        res.end('Niet gevonden');
        return;
      }
      file = path.join(root, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Length': body.length,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(400);
    res.end('Ongeldig verzoek');
  }
});
server.on('error', (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () =>
  console.log('KosterBro’s productiepreview: http://localhost:4173/'),
);
