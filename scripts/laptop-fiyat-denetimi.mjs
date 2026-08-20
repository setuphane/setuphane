/* Laptop fiyat denetimi:  EPEY_DIR=... node scripts/laptop-fiyat-denetimi.mjs
   Laptoplarda model adi guvenilir bir anahtar degil (ayni seri onlarca
   varyantla satiliyor). Guvenilir anahtar URETICI KODU: NH.QZ7EY.003,
   83GS00PGTR, C21SGEA gibi. Once kodla, kod tutmazsa marka + islemci +
   ekran karti + RAM ucluyle esleniyor. */
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const i = s.indexOf('const LAPTOPS=['), j = s.indexOf('\n];', i);
const LAPTOPS = new Function('return ' + s.slice(i + 'const LAPTOPS='.length, j + 2))();
const epey = JSON.parse(readFileSync(`${process.env.EPEY_DIR}/laptop.json`, 'utf8'));

const MIN_SATICI = 3;
const buyuk = t => t.toUpperCase().replace(/İ/g, 'I');
/* Uretici kodu: en az 6 karakter, harf+rakam karisik, nokta/tire olabilir. */
const kodlar = ad => (buyuk(ad).match(/\b[A-Z0-9][A-Z0-9.\-]{5,}\b/g) || [])
  .filter(k => /[0-9]/.test(k) && /[A-Z]/.test(k))
  .filter(k => !/^(RTX|GTX|RYZEN|DDR|SSD|NVME)/.test(k));

const tl = n => n.toLocaleString('tr-TR') + ' TL';
const epeyKod = epey.map(x => ({ ...x, kod: buyuk(x.ad) }));

let esli = 0, sapan = 0, kayip = 0;
const rapor = [];

/* Kod eslesmesi TEK BASINA yetmiyor: "Slayer5" gibi seri adlari da kod
   suzgecinden geciyor ve 5080'lik modelimizi 5070'lik bir laptopla
   esleyip "%50 ucuz" gibi tamamen yanlis bir sonuc uretiyordu.
   Bu yuzden eslesen ilanin ekran karti da AYNI olmak zorunda. */
const kartAnahtari = t => {
  const u = buyuk(t).replace(/\s+/g, ' ');
  const m = u.match(/(RTX|GTX|RX)\s?(\d{4})\s?(TI|SUPER)?/);
  return m ? m[1] + m[2] + (m[3] || '') : null;
};

for (const l of LAPTOPS) {
  const ks = kodlar(l.name);
  const bizimKart = kartAnahtari(l.gpu) || kartAnahtari(l.name);
  let aday = [];
  for (const k of ks) {
    aday = epeyKod.filter(x => x.kod.includes(k));
    if (aday.length) break;
  }
  if (bizimKart) aday = aday.filter(x => {
    const ek = kartAnahtari(x.ad);
    return !ek || ek === bizimKart;
  });
  const yeterli = aday.filter(x => x.satici >= MIN_SATICI);
  if (!yeterli.length) {
    kayip++;
    rapor.push({ tip: '?', l, not: aday.length ? `${aday.length} ilan ama 3+ satici yok` : 'Epey listesinde bulunamadi' });
    continue;
  }
  esli++;
  const en = yeterli.reduce((a, b) => b.fiyat < a.fiyat ? b : a);
  const fark = (en.fiyat - l.price) / l.price;
  if (Math.abs(fark) >= 0.07) { sapan++; rapor.push({ tip: fark < 0 ? 'UCUZ' : 'PAHALI', l, en, fark }); }
  else rapor.push({ tip: 'ok', l, en, fark });
}

for (const r of rapor.sort((a, b) => a.l.price - b.l.price)) {
  const ad = r.l.name.slice(0, 62);
  if (r.tip === '?') { console.log(`  ?      ${tl(r.l.price).padStart(11)}  ${ad}\n           ${r.not}`); continue; }
  if (r.tip === 'ok') { console.log(`  ok     ${tl(r.l.price).padStart(11)}  ${ad}`); continue; }
  console.log(`  ${r.tip.padEnd(6)} ${tl(r.l.price).padStart(11)} -> ${tl(r.en.fiyat).padStart(11)} (%${(r.fark * 100).toFixed(0)})  ${ad}`);
  console.log(`           Epey: ${r.en.ad.slice(0, 78)} [${r.en.satici} satici]`);
}
console.log(`\n─ ${LAPTOPS.length} laptop: ${esli} eslesti (${sapan} sapma), ${kayip} tanesi Epey'de 3+ saticiyla yok ─`);
