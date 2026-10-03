import http from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const destination = fileURLToPath(new URL('../assets/', import.meta.url));
await mkdir(destination, { recursive: true });
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin !== 'http://127.0.0.1:1422' && origin !== 'http://localhost:1422') {
    res.writeHead(403).end(); return;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const match = /^\/asset\/([a-z0-9-]+\.(?:glb|json|png))$/.exec(req.url);
  if (req.method !== 'POST' || !match) { res.writeHead(404).end(); return; }
  try {
    let size = 0; const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 64 * 1024 * 1024) throw new Error('Asset exceeds 64 MiB');
      chunks.push(chunk);
    }
    await writeFile(destination + match[1], Buffer.concat(chunks));
    console.log('Saved', match[1], size);
    res.writeHead(201).end('saved');
  } catch (error) { console.error(error.message); res.writeHead(400).end('Export failed'); }
});
server.listen(1427, '127.0.0.1', () => console.log('Local asset receiver on 127.0.0.1:1427'));
