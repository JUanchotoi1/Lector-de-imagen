'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const HOME_PAGE = 'lector_de_imagen_esc_ner_ocr.html';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (pathname === '/') pathname = `/${HOME_PAGE}`;

  const relativePath = path.normalize(pathname.replace(/^[/\\]+/, ''));
  const filePath = path.resolve(ROOT, relativePath);
  const relativeToRoot = path.relative(ROOT, filePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8',
      });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Could not read file');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': data.length,
      'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other server or set PORT to another number.`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log(`Lector disponible en: http://${HOST}:${PORT}/`);
  console.log('Presiona Ctrl+C para detener el servidor.');
});
