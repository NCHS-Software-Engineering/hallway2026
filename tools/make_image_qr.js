#!/usr/bin/env node
/**
 * tools/make_image_qr.js
 * Generates a QR pointing to a raw GitHub image URL or serves local file (--serve-local).
 *
 * Usage example (used by prestart from client/):
 *   node ../tools/make_image_qr.js --repo=Owner/Repo --branch=main --path=client/public/firstFloor2.png --out=public/qr.png --format=png
 *
 * For local serving (phone on same Wi‑Fi):
 *   node tools/make_image_qr.js --serve-local --path=client/public/firstFloor2.png --port=8080 --format=terminal
 *
 * Requires: npm install qrcode (run inside client/)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const QRCode = require('qrcode');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  args.forEach(a => {
    if (a.startsWith('--repo=')) opts.repo = a.split('=')[1];
    else if (a.startsWith('--branch=')) opts.branch = a.split('=')[1];
    else if (a.startsWith('--path=')) opts.filePath = a.split('=')[1];
    else if (a.startsWith('--out=')) opts.out = a.split('=')[1];
    else if (a.startsWith('--format=')) opts.format = a.split('=')[1];
    else if (a.startsWith('--rawUrl=')) opts.rawUrl = a.split('=')[1];
    else if (a === '--serve-local') opts.serveLocal = true;
    else if (a.startsWith('--port=')) opts.port = parseInt(a.split('=')[1], 10);
    else if (a === '--help' || a === '-h') opts.help = true;
  });
  return opts;
}

function usageAndExit(code = 1) {
  console.log(`
Usage:
  node tools/make_image_qr.js --repo=owner/repo --branch=main --path=client/public/image.png --out=public/qr.png
  OR
  node tools/make_image_qr.js --rawUrl=https://raw.githubusercontent.com/.../image.png --out=public/qr.png
  OR
  node tools/make_image_qr.js --serve-local --path=client/public/image.png --port=8000

Notes:
 - When invoked from client/ (prestart), use --out=public/qr.png so the file ends up at client/public/qr.png
`);
  process.exit(code);
}

function buildRawUrlFromRepo(repo, branch, filePath) {
  const branchName = branch || 'main';
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) throw new Error('--repo must be owner/repo');
  const p = (filePath || '').replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${owner}/${repoName}/${branchName}/${p}`;
}

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

async function generateQrToFile(url, format, outFile) {
  if (format === 'terminal') {
    const str = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log(str);
    console.log('Scan the QR above with your phone to open:', url);
    return;
  }

  const finalOut = outFile || (format === 'svg' ? 'qr.svg' : 'qr.png');
  // ensure directory exists
  const dir = path.dirname(finalOut);
  if (dir) fs.mkdirSync(dir, { recursive: true });

  if (format === 'svg') {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 2, width: 400 });
    fs.writeFileSync(finalOut, svg, 'utf8');
    console.log(`Wrote SVG QR to ${finalOut}`);
  } else {
    await QRCode.toFile(finalOut, url, { type: 'png', margin: 2, width: 400 });
    console.log(`Wrote PNG QR to ${finalOut}`);
  }
  console.log('URL encoded in QR:', url);
}

async function serveLocalAndMakeQr(opts) {
  const filePath = opts.filePath;
  if (!filePath) throw new Error('--path is required for --serve-local');
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const port = opts.port || 8000;
  const hostname = getLocalIPv4();
  if (!hostname) throw new Error('Cannot detect local IPv4 address. Are you offline?');

  const basename = path.basename(abs);
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === `/${basename}`) {
      const stream = fs.createReadStream(abs);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
      stream.pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    const url = `http://${hostname}:${port}/${basename}`;
    console.log('Serving', abs, '->', url);
    generateQrToFile(url, opts.format || 'png', opts.out).catch(err => console.error('QR gen failed:', err));
    console.log('HTTP server is running. Press Ctrl+C to stop when done.');
  });

  server.on('error', err => {
    console.error('Server error:', err);
    process.exit(2);
  });
}

(async function main() {
  const opts = parseArgs();
  if (opts.help) return usageAndExit(0);

  const format = (opts.format || 'png').toLowerCase();
  if (!['png', 'svg', 'terminal'].includes(format)) return usageAndExit(1);

  try {
    if (opts.serveLocal) {
      return await serveLocalAndMakeQr({ filePath: opts.filePath, port: opts.port, format, out: opts.out });
    }

    let url = opts.rawUrl;
    if (!url) {
      if (!opts.repo || !opts.filePath) return usageAndExit(1);
      url = buildRawUrlFromRepo(opts.repo, opts.branch, opts.filePath);
    }

    // When called from client/, --out=public/qr.png will resolve to client/public/qr.png
    await generateQrToFile(url, format, opts.out);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();