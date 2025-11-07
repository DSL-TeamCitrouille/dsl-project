#!/usr/bin/env node

/**
 * HTTP Server for ES Modules
 * Serves files with correct MIME types
 * Fixes "disallowed MIME type" error
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const PORT = process.env.PORT || 3000;

// Get the serve directory from command line or use current directory
const SERVE_DIR = process.argv[2] || process.cwd();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          🌐 ES MODULE SERVER STARTED                          ║
╚════════════════════════════════════════════════════════════════╝

📁 Serving from: ${SERVE_DIR}
🔗 URL: http://localhost:${PORT}

Press Ctrl+C to stop

═══════════════════════════════════════════════════════════════════
`);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ts': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Remove query string
  let filePath = req.url?.split('?')[0] || '/';

  // Default to index.html for root
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Resolve file path
  const fullPath = path.join(SERVE_DIR, filePath);

  // Prevent directory traversal attacks
  if (!fullPath.startsWith(SERVE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    console.log(`❌ 403 Forbidden: ${req.url}`);
    return;
  }

  // Check if file exists
  fs.stat(fullPath, (err, stats) => {
    if (err || stats.isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      console.log(`❌ 404 Not Found: ${req.url}`);
      return;
    }

    // Get MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(fullPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        console.log(`❌ 500 Error: ${req.url}`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
      });
      res.end(content);
      console.log(`✓ 200 ${mimeType}: ${req.url}`);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Ready! Open: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✋ Server stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n✋ Server terminated');
  process.exit(0);
});