// Basit statik önizleme sunucusu. Üretim dosyası index.html'i servis eder
// (vercel.json'daki rewrite kuralını taklit ederek her yolu index.html'e
// düşürür) — böylece /aksesuarlar gibi rotalar sayfa yenilemesinde de
// doğru render'ı bulur. Kaynak üzerinde canlı önizleme için src/setuphane.html
// dosyasını doğrudan tarayıcıda açmak yeterli (Babel/Tailwind CDN kullanır).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 5180;

const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml',
  '.xml':'application/xml', '.txt':'text/plain', '.json':'application/json' };

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(root, urlPath);
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = path.join(root, 'index.html');
  } catch {
    filePath = path.join(root, 'index.html');
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('404');
  }
}).listen(port, () => console.log('dev preview: http://localhost:' + port));
