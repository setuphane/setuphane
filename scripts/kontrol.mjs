// Veri butunluk kontrolu:  node scripts/kontrol.mjs
// build.mjs bunu kendi basinda calistirir; hata varsa derleme durur.
//
// Neden: site tek dosyada, testi yok ve push'ta yayina cikiyor. Veri artik
// panelden de duzenleniyor. Sessizce bozulabilecek seyler burada yakalaniyor:
// bir laptopun ekran karti GPU_IDX'te yoksa gucu varsayilana duser ve FPS
// yanlis cikar; bir islemcinin soketi yanlissa uyumsuz anakart onerilir;
// bir kategori bosalirsa sistem kurma coker.
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const hatalar = [], uyarilar = [];

function dizi(ad) {
  const i = s.indexOf('const ' + ad + '=[');
  if (i < 0) throw new Error(ad + ' bulunamadi');
  const j = s.indexOf('\n];', i);
  return new Function('Infinity', 'return ' + s.slice(i + ('const ' + ad + '=').length, j + 2))(Number.POSITIVE_INFINITY);
}
function nesne(ad, cokSatir = true) {
  const i = s.indexOf('const ' + ad + '={');
  const j = cokSatir ? s.indexOf('\n};', i) : s.indexOf('};', i);
  return new Function('return ' + s.slice(i + ('const ' + ad + '=').length, j + (cokSatir ? 2 : 1)))();
}

const GPUS = dizi('GPUS'), CPUS = dizi('CPUS'), RAMS = dizi('RAMS'), SSDS = dizi('SSDS');
const PSUS = dizi('PSUS'), COOLERS = dizi('COOLERS'), CASES = dizi('CASES');
const LAPTOPS = dizi('LAPTOPS'), GAMES = dizi('GAMES'), RES = dizi('RES');
const BOARDS = nesne('BOARDS');
const GPU_IDX = nesne('GPU_IDX', false);
const LAPTOP_VRAM = nesne('LAPTOP_VRAM', false);
const LAPTOP_CPU_IDX = nesne('LAPTOP_CPU_IDX', false);

const yok = (kosul, mesaj) => { if (!kosul) hatalar.push(mesaj); };
const dikkat = (kosul, mesaj) => { if (!kosul) uyarilar.push(mesaj); };

// ── Kategoriler bos kalmamali: buildSystem() her birinden secim yapiyor.
for (const [ad, d] of [['GPUS',GPUS],['CPUS',CPUS],['RAMS',RAMS],['SSDS',SSDS],
                       ['PSUS',PSUS],['COOLERS',COOLERS],['CASES',CASES]])
  yok(d.length > 0, ad + ' bos — sistem kurma coker.');
yok(Object.keys(BOARDS).length > 0, 'BOARDS bos — anakart secilemez.');

// ── Fiyatlar
const fiyatKontrol = (d, ad, sifirSerbest = false) => d.forEach(x => {
  const p = x.p;
  yok(typeof p === 'number' && isFinite(p) && p >= 0, `${ad}: "${x.n}" fiyati gecersiz (${p}).`);
  if (!sifirSerbest) dikkat(p > 0, `${ad}: "${x.n}" fiyati 0 — kasitli mi?`);
});
fiyatKontrol(GPUS, 'GPUS', true);   // igpu 0 TL, dogru
fiyatKontrol(CPUS, 'CPUS');
fiyatKontrol(RAMS, 'RAMS'); fiyatKontrol(SSDS, 'SSDS'); fiyatKontrol(PSUS, 'PSUS');
fiyatKontrol(COOLERS, 'COOLERS', true);   // stock sogutucu 0 TL
CASES.forEach(c => yok(typeof c.p === 'number' && c.p > 0, `CASES: "${c.n}" fiyati gecersiz.`));

// ── Benzersiz kimlikler: ayni id iki kez olursa panel/override eslesmesi bozulur.
for (const [ad, d] of [['GPUS',GPUS],['CPUS',CPUS],['RAMS',RAMS],['SSDS',SSDS],
                       ['PSUS',PSUS],['COOLERS',COOLERS]]) {
  const g = new Set();
  d.forEach(x => { yok(!g.has(x.id), `${ad}: "${x.id}" kimligi iki kez geciyor.`); g.add(x.id); });
}

// ── Islemci ve anakart soketleri birbirini tutmali.
const platformlar = new Set(Object.keys(BOARDS));
CPUS.forEach(c => yok(platformlar.has(c.plat),
  `CPUS: "${c.n}" soketi "${c.plat}" ama BOARDS'ta bu platform yok — uyumsuz sistem onerilir.`));
Object.entries(BOARDS).forEach(([plat, l]) => {
  yok(l.length > 0, `BOARDS: "${plat}" bos — o platformda sistem kurulamaz.`);
  l.forEach(x => yok(typeof x.t === 'number' && x.t >= 1, `BOARDS ${plat}: "${x.n}" kademesi gecersiz.`));
});

// ── Guc kaynagi en agir sistemi kaldirmali.
const enYuksekTuketim = Math.max(...GPUS.map(g => g.tdp || 0)) + Math.max(...CPUS.map(c => c.tdp || 0));
const enBuyukPsu = Math.max(...PSUS.map(p => p.w || 0));
yok(enBuyukPsu >= enYuksekTuketim,
  `PSUS: en buyuk guc kaynagi ${enBuyukPsu} W ama en agir kombinasyon ${enYuksekTuketim} W cekiyor.`);

// ── Sogutucu en sicak islemciyi kaldirmali.
const enYuksekCpuTdp = Math.max(...CPUS.map(c => c.tdp || 0));
yok(Math.max(...COOLERS.map(c => c.cap || 0)) >= enYuksekCpuTdp,
  `COOLERS: en guclu sogutucu en yuksek islemci TDP'sini (${enYuksekCpuTdp} W) kaldirmiyor.`);

// ── Kasa esikleri: en az biri sinirsiz olmali, yoksa ust butcede kasa cikmaz.
yok(CASES.some(c => !isFinite(c.upTo)), 'CASES: sinirsiz (upTo:Infinity) kasa yok — ust butcede kasa secilemez.');

// ── Laptoplar
const gorulenAd = new Set();
LAPTOPS.forEach(l => {
  yok(GPU_IDX[l.gpu] != null,
    `LAPTOPS: "${l.name.slice(0,44)}" ekran karti "${l.gpu}" GPU_IDX'te yok — guc varsayilana duser, FPS yanlis cikar.`);
  yok(LAPTOP_VRAM[l.gpu] != null,
    `LAPTOPS: "${l.gpu}" LAPTOP_VRAM'de yok — VRAM 8 varsayilir.`);
  yok(typeof l.price === 'number' && l.price > 0, `LAPTOPS: "${l.name.slice(0,44)}" fiyati gecersiz.`);
  yok(/^https:\/\//.test(l.url || ''), `LAPTOPS: "${l.name.slice(0,44)}" linki https degil.`);
  yok(/^https:\/\//.test(l.image || ''), `LAPTOPS: "${l.name.slice(0,44)}" gorseli https degil.`);
  yok(l.idx === Math.round(GPU_IDX[l.gpu] ?? l.idx),
    `LAPTOPS: "${l.name.slice(0,44)}" idx (${l.idx}) GPU_IDX["${l.gpu}"] (${GPU_IDX[l.gpu]}) ile uyusmuyor.`);
  yok(!gorulenAd.has(l.name), `LAPTOPS: "${l.name.slice(0,44)}" iki kez var (veritabaninda unique kisiti reddeder).`);
  gorulenAd.add(l.name);
  dikkat(!l.cpu || LAPTOP_CPU_IDX[l.cpu] != null,
    `LAPTOPS: "${l.cpu}" LAPTOP_CPU_IDX'te yok — o laptopta islemci siniri uygulanmaz.`);
});

// ── Oyun/cozunurluk katsayilari
GAMES.forEach(g => {
  yok(g.k > 0 && g.ck > 0, `GAMES: "${g.n}" katsayisi gecersiz.`);
  yok(g.vram > 0, `GAMES: "${g.n}" vram esigi gecersiz.`);
});
RES.forEach(r => yok(r.mul > 0 && r.mul <= 1, `RES: "${r.n}" carpani gecersiz (${r.mul}).`));

// ── Aksesuar kategorileri ile urun anahtarlari tutuyor mu
const katlar = new Set(dizi('AKSESUAR_KATEGORILERI').map(k => k.id));
const URUN = nesne('AKSESUAR_URUNLERI');
Object.keys(URUN).forEach(k => yok(katlar.has(k),
  `AKSESUAR_URUNLERI: "${k}" kategorisi AKSESUAR_KATEGORILERI'nde yok — o urunler hicbir yerde gorunmez.`));
Object.entries(URUN).forEach(([k, l]) => l.forEach(u => {
  yok(/^https:\/\//.test(u.link || ''), `AKSESUAR (${k}): "${u.ad}" linki https degil.`);
  yok(/^https:\/\//.test(u.gorsel || ''), `AKSESUAR (${k}): "${u.ad}" gorseli https degil.`);
  yok(Array.isArray(u.anahtar) && u.anahtar.length > 0, `AKSESUAR (${k}): "${u.ad}" anahtar kelimesi yok — /oner bulamaz.`);
}));

// ── Sonuc
if (uyarilar.length) {
  console.warn('UYARI:');
  uyarilar.forEach(u => console.warn('  - ' + u));
}
if (hatalar.length) {
  console.error('\nVERI HATASI (' + hatalar.length + '):');
  hatalar.forEach(h => console.error('  - ' + h));
  process.exit(1);
}
console.log(`Veri kontrolu tamam — ${LAPTOPS.length} laptop, ` +
  `${GPUS.length + CPUS.length + RAMS.length + SSDS.length + PSUS.length + COOLERS.length + CASES.length} parca, ` +
  `${Object.values(URUN).reduce((a, l) => a + l.length, 0)} aksesuar.`);
