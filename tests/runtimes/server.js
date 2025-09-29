import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Special handling for WASM files
  if (req.url && req.url.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  let filePath = req.url;
  
  // Default to index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Resolve file path
  const fullPath = join(__dirname, 'public', filePath);
  
  // Check if file exists
  if (!existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
    return;
  }
  
  // Get file extension and content type
  const ext = extname(fullPath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
