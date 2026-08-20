/* Aksesuar linklerinin canliligi:  node scripts/link-denetimi.mjs
   Aksesuarlarda fiyat tutmuyoruz (fiyat riski yok) ama olu bir link
   ziyaretciyi bos sayfaya goturur; itibar acisindan fiyat kadar onemli. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const i = s.indexOf('const AKSESUAR_URUNLERI={'), j = s.indexOf('\n};', i);
const K = new Function('return ' + s.slice(i + 'const AKSESUAR_URUNLERI='.length, j + 2))();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const urunler = Object.entries(K).flatMap(([kat, l]) => l.map(u => ({ kat, ...u })));
console.log(`${urunler.length} aksesuar linki denetleniyor...\n`);
let kotu = 0;
for (const u of urunler) {
  let kod = '???';
  try {
    kod = execFileSync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-L',
      '--max-time', '25', '-A', UA, u.link], { encoding: 'utf8' }).trim();
  } catch (e) { kod = 'HATA'; }
  const iyi = kod === '200';
  if (!iyi) kotu++;
  console.log(`  ${iyi ? 'ok  ' : 'KOTU'} ${kod.padEnd(5)} ${u.kat.padEnd(12)} ${u.ad.slice(0, 52)}`);
}
console.log(`\n─ ${urunler.length} link, ${kotu} sorunlu ─`);
