import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const argumentsMap = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, value = ''] = argument.replace(/^--/, '').split('=', 2);
    return [key, value];
  })
);

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

function resolveRequestPath(url, root) {
  let pathname;
  try {
    const rawPathname = url.split(/[?#]/, 1)[0].replaceAll('\\', '/');
    pathname = decodeURIComponent(rawPathname).replaceAll('\\', '/');
  } catch {
    return null;
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.some((segment) => segment.startsWith('.'))) return null;

  const requested = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(root, `.${requested}`);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

export async function startTestServer({ port = 4173, root: rootValue = '.' } = {}) {
  const root = path.resolve(rootValue);
  const server = createServer(async (request, response) => {
    const filePath = resolveRequestPath(request.url || '/', root);

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

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

export async function stopTestServer(server) {
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const port = Number.parseInt(argumentsMap.get('port') || '4173', 10);
  const root = argumentsMap.get('root') || '.';
  const server = await startTestServer({ port, root });
  console.log(`Test server listening on http://127.0.0.1:${port}`);

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      await stopTestServer(server);
      process.exit(0);
    });
  }
}
