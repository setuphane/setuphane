// Katalogdaki urun gorsellerini kendi sunucumuza indirir:
//   node scripts/gorsel-indir.mjs
//
// Neden: gorseller Ulugames/Wraith'in Shopify CDN'inden ve Cimri'den
// cekiliyordu. Onlar adresi degistirirse ya da dis siteye gorsel vermeyi
// kapatirsa 100'den fazla gorsel ayni anda kirilirdi; ayrica onlarin bant
// genisligini kullaniyorduk.
//
// Site tarafinda gorselYolu() ayni dosya adini uretip once /urun/ altina
// bakiyor, dosya yoksa ORIJINAL adrese geri donuyor. Bu yuzden panelden
// yeni bir urun eklendiginde bir sey bozulmuyor: gorsel disaridan gelmeye
// devam eder, istenirse bu betik tekrar calistirilip yerele alinir.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hedef = path.join(kok, 'urun');
mkdirSync(hedef, { recursive: true });

const s = readFileSync(path.join(kok, 'src/setuphane.html'), 'utf8');
const adresler = [...new Set([
  ...[...s.matchAll(/gorsel:'([^']+)'/g)].map(m => m[1]),
  ...[...s.matchAll(/image:'([^']+)'/g)].map(m => m[1]),
])].filter(u => /^https:\/\//.test(u));

// Site ile AYNI kural: sorgu parametresi atilir, son parca dosya adi olur.
const dosyaAdi = u => (u.split('?')[0].split('/').pop() || '').replace(/[^a-zA-Z0-9._-]/g, '');

let indi = 0, atlandi = 0, hata = [];
for (const u of adresler) {
  const ad = dosyaAdi(u);
  if (!ad) { hata.push('ad uretilemedi: ' + u); continue; }
  const yol = path.join(hedef, ad);
  if (existsSync(yol) && statSync(yol).size > 0) { atlandi++; continue; }
  try {
    const r = await fetch(u);
    if (!r.ok) { hata.push(r.status + ' ' + u.slice(0, 70)); continue; }
    const tip = r.headers.get('content-type') || '';
    if (!/^image\//.test(tip)) { hata.push('gorsel degil (' + tip + '): ' + u.slice(0, 60)); continue; }
    writeFileSync(yol, Buffer.from(await r.arrayBuffer()));
    indi++;
  } catch (e) { hata.push(String(e.message).slice(0, 50) + ' — ' + u.slice(0, 60)); }
}

console.log(`Gorsel: ${indi} indirildi, ${atlandi} zaten vardi, ${hata.length} hata (toplam ${adresler.length}).`);
hata.slice(0, 10).forEach(h => console.error('  - ' + h));
if (hata.length) process.exitCode = 1;
