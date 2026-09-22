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
mkdirSync('urun/parca/3b', { recursive: true });
const dosya3b = a => 'urun/parca/3b/' + a.replace(/:/g, '-') + '.jpg';
const kaynak = {};
let indi = 0, var_ = 0, hata = [];
for (const [anahtar, link] of Object.entries(eslesme)) {
  const hedef = dosya(anahtar);
  if (!HEPSI && existsSync(hedef) && statSync(hedef).size > 1000) { var_++; continue; }
  try {
    const h = execFileSync(CURL, ['-sS', '--compressed', '-A', UA, '--max-time', '30', link], { encoding: 'utf8', maxBuffer: 6e7 });
    let og = (h.match(/property="og:image"[^>]*content="([^"]+)"|content="([^"]+)"[^>]*property="og:image"/) || []).slice(1).find(Boolean);
    if (!og) throw new Error('og:image yok');
    /* 22.09.2026: bazı ürünlerde og:image kırık (Zalman 1200 W: z_/m_ .jpg 404),
       galeri görselleri .png. O zaman galerinin ilk orta boyu alınır (tarayıcı
       içeriğe bakar, .jpg adıyla da gösterir). */
    const galeri = (h.match(/https?:\/\/resim\.epey\.com\/\d+\/m_[^"' )]+\.(?:png|jpg|webp)/) || [])[0];
    const durum = u => execFileSync(CURL, ['-s', '-A', UA, '-r', '0-0', '-w', '%{http_code}', u], { encoding: 'latin1' }).slice(-3);
    if (galeri && !/^20[06]$/.test(durum(og.replace(/\/(?:[a-z]_)?([^/]+)$/, '/m_$1')))) og = galeri;
    const kucuk = og.replace(/\/(?:[a-z]_)?([^/]+)$/, '/z_$1').replace('/z_z_', '/z_');
    execFileSync(CURL, ['-sS', '-A', UA, '--max-time', '30', '-o', hedef, kucuk]);
    if (!existsSync(hedef) || statSync(hedef).size < 1000)   // z_ yoksa orta boy (m_)
      execFileSync(CURL, ['-sS', '-A', UA, '--max-time', '30', '-o', hedef, og.replace(/\/(?:[a-z]_)?([^/]+)$/, '/m_$1')]);
    if (!existsSync(hedef) || statSync(hedef).size < 1000) throw new Error('görsel küçük/boş');
    /* 3B sahne için orta boy (m_, ~350 px) — yalnız "3B gör" açılınca yüklenir. */
    try { execFileSync(CURL, ['-sS', '-A', UA, '--max-time', '30', '-o', dosya3b(anahtar), og.replace(/\/(?:[a-z]_)?([^/]+)$/, '/m_$1')]);
      if (statSync(dosya3b(anahtar)).size < 1500) writeFileSync(dosya3b(anahtar), ''); } catch {}
    kaynak[anahtar] = og; indi++;
    console.log('ok  ' + anahtar.padEnd(18) + ' ' + Math.round(statSync(hedef).size / 1024) + ' KB');
  } catch (e) { hata.push(anahtar + ': ' + e.message.slice(0, 60)); }
  await new Promise(r => setTimeout(r, 600));
}
/* Küçük görsel boş/bozuk (bazı ürünlerde z_ sürümü yok) ya da kaynağı zaten
   büyükse (anakart görselleri 180 KB+) orta boy sürüm kullanılır. */
import('node:fs').then(({ readdirSync, copyFileSync, unlinkSync }) => {
  for (const f of readdirSync('urun/parca/3b')) {
    const b = 'urun/parca/3b/' + f, k = 'urun/parca/' + f;
    const bs = statSync(b).size;
    if (bs < 1500) { unlinkSync(b); continue; }
    const ks = existsSync(k) ? statSync(k).size : 0;
    if ((ks < 1500 || ks > 60000) && bs < 60000) { copyFileSync(b, k); console.log('orta boy kullanıldı: ' + f); }
  }
  for (const f of readdirSync('urun/parca')) if (f.endsWith('.jpg') && statSync('urun/parca/' + f).size < 1500) unlinkSync('urun/parca/' + f);
});
console.log(`\n${indi} indirildi, ${var_} zaten vardı, ${hata.length} hata`);
hata.forEach(h => console.log('  !! ' + h));
