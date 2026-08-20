// Epey fiyat tarayicisi:  node scripts/epey-tara.mjs <kategori-slug> [sayfa-sayisi]
// Epey liste sayfalari her urun icin EN DUSUK fiyati ve kac satici oldugunu
// veriyor; ikisi de bizim icin sart (tek saticili absurt ilanlari eliyoruz).
// Cikti: satir basina  fiyat | satici | urun adi
import { execFileSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export async function tara(slug, sayfa = 3) {
  const cikti = [];
  for (let s = 1; s <= sayfa; s++) {
    const url = s === 1 ? `https://www.epey.com/${slug}/` : `https://www.epey.com/${slug}/${s}/`;
    /* Node'un fetch'i Epey'de 403 aliyor (TLS parmak izi), curl aliyor. */
    let h;
    try { h = execFileSync('curl', ['-sS', '--compressed', '-A', UA,
            '-H', 'accept-language: tr-TR,tr;q=0.9', url],
            { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }); }
    catch (e) { console.error(`  ! ${url} -> ${e.message}`); break; }
    if (h.length < 5000) { console.error(`  ! ${url} -> bos/engellendi`); break; }
    // Her urun bloku: urunadi title -> ... -> fiyat cell -> "1.234,56 TL<span>N site, M fiyat</span>"
    const bloklar = h.split('class="urunadi"').slice(1);
    for (const b of bloklar) {
      const ad = b.match(/title="([^"]+)"/);
      const fy = b.match(/class="fiyat cell"[\s\S]{0,400}?>([\d.,]+)\s*TL<span>(\d+)\s*site/);
      if (!ad || !fy) continue;
      const fiyat = Math.round(parseFloat(fy[1].replace(/\./g, '').replace(',', '.')));
      cikti.push({ ad: ad[1].replace(/\s*(Ekran Kartı|İşlemci|Anakart|Ram|SSD|Kasa|Power Supply)$/i, '').trim(),
                   fiyat, satici: +fy[2] });
    }
    await new Promise(z => setTimeout(z, 700));   // sunucuyu yormayalim
  }
  return cikti;
}

if (process.argv[1] && process.argv[1].endsWith('epey-tara.mjs')) {
  const [slug, n] = process.argv.slice(2);
  const v = await tara(slug, +n || 3);
  console.error(`${slug}: ${v.length} urun`);
  for (const x of v) console.log(`${String(x.fiyat).padStart(9)} | ${String(x.satici).padStart(2)} satici | ${x.ad}`);
}
