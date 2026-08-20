/* Incehesap OEM paketleri arasindan bant bant EN IYISINI secer.
     node scripts/oem-sec.mjs
   Secim kurallari (siteyi ayakta tutan sey bu kurallar, fiyat degil):
   1. DDR5 sart. AM4/DDR4 sistemler bugun ucuz gorunuyor ama olu platform:
      alan kisi bir daha islemci yukseltemez. Kotu tavsiye.
   2. Ekran kartina gore islemci ne cok zayif ne asiri guclu olmali.
      "Ryzen 7 7800X3D + RTX 5060 Ti 8 GB" gibi paketler tam olarak
      kacinmamiz gereken sey: para yanlis parcaya gitmis.
   3. VRAM 2026'da 8 GB'in ustunde olmali (60 bin ve uzeri sistemlerde).
   4. Ayni bantta esitlik varsa: once VRAM, sonra disk, sonra RAM.       */
import { readFileSync, writeFileSync } from 'node:fs';

const OEM = JSON.parse(readFileSync('.oem.json', 'utf8'));

/* Ekran karti gucu — sitenin kendi GPUS tablosuyla ayni olcek. */
const KART = {
  'rtx 3060': 40, 'rx 7600': 48, 'rtx 5060': 58, 'rx 9060': 55, 'rx 9060 xt': 64,
  'rtx 4060': 52, 'rtx 5060 ti': 74, 'rtx 4070': 88, 'rx 9070': 92, 'rtx 5070': 100,
  'rtx 4070 super': 104, 'rx 9070 xt': 112, 'rtx 5070 ti': 126, 'rtx 5080': 152, 'rtx 5090': 205,
};
/* Islemcinin oyun gucu — sitedeki CPUS.g ile ayni olcek. */
const ISLEMCI = {
  'ryzen 5 5500': 46, 'ryzen 5 5600': 52, 'ryzen 7 5700': 56,
  'i5-14400f': 72, 'ryzen 5 7500f': 74, 'ryzen 5 7600': 78, 'ryzen 5 7600x': 84,
  'ryzen 5 9600x': 92, 'ryzen 5 7500x3d': 98, 'ryzen 7 9700x': 94,
  'i9-14900k': 104, 'ryzen 7 7700x3d': 104, 'ryzen 7 7800x3d': 108,
  'ryzen 7 9800x3d': 125, 'ryzen 9 9900x3d': 122, 'ryzen 9 9950x3d': 128, 'ryzen 9 9950x3d2': 128,
};

const kucuk = t => t.toLowerCase().replace(/ı/g,'i').replace(/\s+/g,' ');
const enUzunEslesme = (metin, tablo) => {
  let bulunan = null;
  for (const k of Object.keys(tablo))
    if (metin.includes(k) && (!bulunan || k.length > bulunan.length)) bulunan = k;
  return bulunan;
};

function coz(x) {
  const t = kucuk(x.name);
  const kartAd = enUzunEslesme(t, KART);
  const cpuAd  = enUzunEslesme(t, ISLEMCI);
  const vramM  = t.match(/(\d+)\s*gb\s*\|/);            // karttan sonraki GB
  const vram   = (t.match(/(?:rtx|rx)[^|]*?(\d+)\s*gb/) || [])[1];
  const ramM   = t.match(/(?:(\d+)\s*x\s*)?(\d+)\s*gb\s*ddr5/);
  const ssdM   = t.match(/(\d+)\s*(tb|gb)\s*(?:ssd|m\.2)/);
  return {
    ...x,
    ad: x.name.split('|')[0].trim(),
    kart: kartAd, kartIdx: KART[kartAd] || 0,
    cpu: cpuAd, cpuIdx: ISLEMCI[cpuAd] || 0,
    vram: vram ? +vram : 0,
    ddr5: /ddr5/.test(t),
    ram: ramM ? (ramM[1] ? +ramM[1] * +ramM[2] : +ramM[2]) : 0,
    ssd: ssdM ? (ssdM[2] === 'tb' ? +ssdM[1] * 1000 : +ssdM[1]) : 0,
  };
}

const hepsi = OEM.map(coz);
const elendi = [];
const uygun = hepsi.filter(s => {
  const at = (sebep) => { elendi.push({ s, sebep }); return false; };
  if (!s.kartIdx || !s.cpuIdx) return at('TANINMADI: ' + s.name.slice(0,70));
  if (!s.ddr5)                 return at('DDR4 / olu platform');
  if (s.price >= 60000 && s.vram < 12) return at(`${s.vram} GB VRAM yetersiz`);
  const oran = (s.cpuIdx * 1.32) / s.kartIdx;
  if (oran > 1.75) return at(`islemciye asiri harcanmis (oran ${oran.toFixed(2)})`);
  if (oran < 0.80) return at(`islemci karti besleyemiyor (oran ${oran.toFixed(2)})`);
  return true;
});

const BANTLAR = [60, 80, 100, 120, 150, 180, 200, 220, 250, 300, 350, 400, 520].map(x => x * 1000);
const tl = n => n.toLocaleString('tr-TR') + ' ₺';

console.log(`${hepsi.length} OEM paket -> ${uygun.length} tanesi kurallardan gecti\n`);
const secilen = [];
let alt = 0;
for (const ust of BANTLAR) {
  const aday = uygun.filter(s => s.price > alt && s.price <= ust);
  alt = ust;
  if (!aday.length) { console.log(`${tl(ust).padStart(11)} bandi  ->  uygun sistem yok`); continue; }
  aday.sort((a, b) => b.kartIdx - a.kartIdx || b.vram - a.vram || b.ssd - a.ssd || b.ram - a.ram || a.price - b.price);
  const s = aday[0];
  secilen.push(s);
  console.log(`${tl(ust).padStart(11)} bandi  ->  ${tl(s.price)}  ${s.ad}`);
  console.log(`              ${s.cpu} + ${s.kart} ${s.vram} GB · ${s.ram} GB RAM · ${s.ssd >= 1000 ? s.ssd/1000 + ' TB' : s.ssd + ' GB'} · ${aday.length} aday arasindan`);
}
console.log(`\nElenenlerden ornekler:`);
const sebepler = {};
elendi.forEach(e => (sebepler[e.sebep.replace(/\(.*\)/, '')] = (sebepler[e.sebep.replace(/\(.*\)/, '')] || 0) + 1));
Object.entries(sebepler).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${String(v).padStart(3)}x ${k}`));

/* --- Secilenlerin urun sayfasindan gorsel ve fiyat dogrulamasi --- */
import { execFileSync } from 'node:child_process';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const cikti = [];
for (const s of secilen) {
  let h = '';
  try { h = execFileSync('curl', ['-sS', '--compressed', '-L', '-A', UA, s.url], { encoding: 'utf8', maxBuffer: 6e7 }); }
  catch (e) { console.error('  ! ' + s.ad + ' sayfasi alinamadi'); }
  /* Sayfadaki ilk resmi almak yanlisti: oneri kartlarindaki gorseli de
     yakalayabiliyordu. og:image bu urune ait KANONIK gorsel.
     (OEM paketlerde ayni kasa fotografinin paylasilmasi normaldir.) */
  const og = h.match(/property="og:image"[^>]*content="([^"]+)"/);
  const gorsel = (og && og[1]) || s.image || '';
  // Sayfadaki fiyat, listedeki fiyatla ayni mi? Degilse uyar.
  const fy = (h.match(/"price"\s*:\s*"?(\d+)/) || [])[1];
  const uyar = fy && Math.abs(+fy - s.price) > 1 ? `  !! liste ${s.price} / sayfa ${fy}` : '';
  console.error(`  ${s.ad.padEnd(20)} gorsel:${gorsel ? 'var' : 'YOK'}${uyar}`);
  cikti.push({ ad: s.ad, fiyat: s.price, cpu: s.cpu, kart: s.kart, vram: s.vram,
               ram: s.ram, ssd: s.ssd, idx: s.kartIdx, cpuIdx: s.cpuIdx,
               url: s.url, gorsel, magaza: 'İncehesap' });
}
writeFileSync('.oem-secilen.json', JSON.stringify(cikti, null, 1));
console.error(`\n${cikti.length} sistem .oem-secilen.json dosyasina yazildi`);
