/* Sistem kurucudaki parçaların GERÇEK ürün görselleri:  node scripts/parca-gorsel.mjs
   Her parça zaten birebir Epey ürün sayfasına bağlı (scripts/epey-eslesme.json —
   fiyat botunun ve "Fiyat karşılaştır" linkinin kullandığı dosya). O sayfanın
   og:image'ından üreticinin resmî görseli alınır, KÜÇÜK sürümü (z_, ~200 px,
   ~6 KB) urun/parca/<anahtar>.jpg olarak kendi sunucumuza indirilir — dış siteye
   canlı bağlanmıyoruz (yavaş ve kırılgan). Derleme (scripts/build.mjs) bu
   klasördeki dosyaları PARCA_GORSEL olarak sayfaya gömer; görseli olmayan parça
   eski çizim ikonla gösterilir. Model değişince bu betik tekrar çalıştırılır
   (--hepsi: var olanları da yeniden indir).                                    */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';

const HEPSI = process.argv.includes('--hepsi');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const CURL = process.env.CURL || 'curl';
const eslesme = JSON.parse(readFileSync('scripts/epey-eslesme.json', 'utf8'));
mkdirSync('urun/parca', { recursive: true });
const dosya = a => 'urun/parca/' + a.replace(/:/g, '-') + '.jpg';
const kaynak = {};
let indi = 0, var_ = 0, hata = [];
for (const [anahtar, link] of Object.entries(eslesme)) {
  const hedef = dosya(anahtar);
  if (!HEPSI && existsSync(hedef) && statSync(hedef).size > 1000) { var_++; continue; }
  try {
    const h = execFileSync(CURL, ['-sS', '--compressed', '-A', UA, '--max-time', '30', link], { encoding: 'utf8', maxBuffer: 6e7 });
    const og = (h.match(/property="og:image"[^>]*content="([^"]+)"|content="([^"]+)"[^>]*property="og:image"/) || []).slice(1).find(Boolean);
    if (!og) throw new Error('og:image yok');
    const kucuk = og.replace(/\/(?:[a-z]_)?([^/]+)$/, '/z_$1').replace('/z_z_', '/z_');
    execFileSync(CURL, ['-sS', '-A', UA, '--max-time', '30', '-o', hedef, kucuk]);
    if (!existsSync(hedef) || statSync(hedef).size < 1000) throw new Error('görsel küçük/boş');
    kaynak[anahtar] = og; indi++;
    console.log('ok  ' + anahtar.padEnd(18) + ' ' + Math.round(statSync(hedef).size / 1024) + ' KB');
  } catch (e) { hata.push(anahtar + ': ' + e.message.slice(0, 60)); }
  await new Promise(r => setTimeout(r, 600));
}
console.log(`\n${indi} indirildi, ${var_} zaten vardı, ${hata.length} hata`);
hata.forEach(h => console.log('  !! ' + h));
