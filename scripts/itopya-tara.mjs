/* İtopya OEM paket tarayıcısı:  node scripts/itopya-tara.mjs
   /oem-paketler?pg=N sayfası ilk N×20 ürünü sunucuda işlenmiş HTML olarak
   döndürüyor (JS gerekmiyor). Her kartta parça dökümü var: işlemci, anakart
   yonga seti, ekran kartı, RAM (modül sayısıyla: "16GB (16GB x 1)"), SSD.
   Çıktı: .itopya.json (gitignored).                                          */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const cek = u => execFileSync(process.env.CURL || 'curl', ['-sSL', '--compressed', '-A', UA,
  '-H', 'accept-language: tr-TR,tr;q=0.9', '--max-time', '90', u], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const temiz = t => t.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export function coz(h) {
  const cikti = [];
  for (const b of h.split('<div class="product-block">').slice(1)) {
    const link = (b.match(/<a href="(\/[^"]+_h\d+)"/) || [])[1];
    const baslik = temiz((b.match(/<h2 class="eseoContainer">([\s\S]*?)<\/h2>/) || [])[1] || '');
    const parca = [...b.matchAll(/<li>[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map(m => temiz(m[1]));
    const fy = b.match(/class="product-price">[\s\S]*?<strong>\s*([\d.]+,\d{2})/);
    if (!link || !fy) continue;
    cikti.push({ magaza: 'İtopya', link: 'https://www.itopya.com' + link, baslik, parca,
      fiyat: Math.round(parseFloat(fy[1].replace(/\./g, '').replace(',', '.'))),
      gorsel: (b.match(/data-src="([^"]+)"/) || [])[1] || null });
  }
  return cikti;
}

if (process.argv[1] && process.argv[1].endsWith('itopya-tara.mjs')) {
  const h = cek('https://www.itopya.com/oem-paketler?pg=40');
  const v = coz(h);
  writeFileSync('.itopya.json', JSON.stringify(v, null, 1));
  console.log(v.length + ' paket -> .itopya.json');
  v.slice(0, 3).forEach(x => console.log(' ', x.fiyat, '|', x.baslik.slice(0, 90), '|', x.parca.join(' ; ')));
}
