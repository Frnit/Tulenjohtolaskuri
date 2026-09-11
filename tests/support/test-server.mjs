import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const argumentsMap = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, value = ''] = argument.replace(/^--/, '').split('=', 2);
    return [key, value];
  })
);

const port = Number.parseInt(argumentsMap.get('port') || '4173', 10);
const root = path.resolve(argumentsMap.get('root') || '.');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8']
]);

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://127.0.0.1').pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(root, `.${requested}`);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

const server = createServer(async (request, response) => {
  const filePath = resolveRequestPath(request.url || '/');

  if (!filePath || !['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(filePath ? 405 : 403).end();
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');

    response.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Length': fileStat.size,
      'Content-Type': contentTypes.get(path.extname(filePath).toLowerCase()) ||
        'application/octet-stream'
    });

    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Test server listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

