const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const port = Number(process.env.INK_PREVIEW_PORT || 8765);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mov':'video/quicktime','.mp4':'video/mp4'};
const server = http.createServer((req, res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.stat(file, (error, info) => {
      if (error || !info.isFile()) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Content-Length', info.size);
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.destroy()); stream.pipe(res);
    });
  });
});
server.on('error', err => { console.error(err.code === 'EADDRINUSE' ? `Port ${port} is already in use. Open the existing preview or set INK_PREVIEW_PORT.` : err.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Ink Studies: http://127.0.0.1:${port}/prototypes/ink/\nKeep this window open. Ctrl+C stops the preview.`));
