// Dependency-free local preview with byte-range support for video seeking.
import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.pdf':'application/pdf', '.mp4':'video/mp4', '.json':'application/json' };
export const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400).end(); return; }
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(root + sep) || pathname.split('/').some(part => part.startsWith('.'))) { response.writeHead(403).end(); return; }
  if (!existsSync(path) || !statSync(path).isFile()) { response.writeHead(404).end('Not found'); return; }
  const size = statSync(path).size;
  const headers = { 'Content-Type':types[extname(path)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' };
  const range = request.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) { response.writeHead(416, { 'Content-Range':`bytes */${size}` }).end(); return; }
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start > end || start >= size) { response.writeHead(416, { 'Content-Range':`bytes */${size}` }).end(); return; }
    response.writeHead(206, { ...headers, 'Content-Length':end - start + 1, 'Content-Range':`bytes ${start}-${end}/${size}` });
    if (request.method === 'HEAD') response.end(); else createReadStream(path, { start, end }).pipe(response);
  } else {
    response.writeHead(200, { ...headers, 'Content-Length':size });
    if (request.method === 'HEAD') response.end(); else createReadStream(path).pipe(response);
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
