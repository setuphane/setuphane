/* Model izleme — her gün fiyat botundan sonra çalışır:
     node scripts/model-izle.mjs
   Kuralımız: bir yonga için "en az 3 satıcıda satılan en ucuz model" kullanılır.
   Ama tek günlük bir fiyata bakıp model değiştirmek yanıltıyor: 23.09.2026'da
   RTX 5060 için 22.900 TL'lik bir ilan en ucuz göründü, ertesi gün 27.498'e
   çıktı ve sitede %20 düşük fiyat kaldı.

   Bu betik HİÇBİR ŞEYİ DEĞİŞTİRMEZ; yalnızca rapor verir. Bir model şu iki
   koşulu birlikte sağlarsa "değiştir" önerisi çıkar:
     1) Aynı model art arda en az GUN (3) gün en ucuz uygun model olmuş,
     2) Bizim modelimizden en az %ESIK (3) ucuz kalmış.
   Durum scripts/model-durum.json'da tutulur (git'e girer, geçmiş izlenebilir). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const kok = new URL('..', import.meta.url);
const { tara } = await import(new URL('scripts/epey-tara.mjs', kok));
const GUN = 3, ESIK = 3, MIN_SATICI = 3;
const DURUM = new URL('scripts/model-durum.json', kok);
const durum = existsSync(DURUM) ? JSON.parse(readFileSync(DURUM, 'utf8')) : {};
const fiyat = JSON.parse(readFileSync(new URL('fiyatlar.json', kok), 'utf8')).parcalar;
const bugun = new Date().toISOString().slice(0, 10);

/* Yonga -> ilan adı deseni. Bellek boyutu farklı olan kardeşler (5060 Ti 8 GB,
   9060 XT 8 GB) ayrı tutulur ki ucuz 8 GB'lık kart 16 GB'ın yerine önerilmesin. */
const YONGA = {
  'gpu:7600':   { re: /Radeon RX 7600(?!\s*XT)/i },
  'gpu:b580':   { re: /Arc B580/i },
  'gpu:5050':   { re: /RTX 5050/i },
  'gpu:5060':   { re: /RTX 5060(?!\s*Ti)/i },
  'gpu:9060xt': { re: /RX 9060 XT/i, bellek: /16\s*GB/i },
  'gpu:5060ti': { re: /RTX 5060 Ti/i, bellek: /16\s*GB/i },
  'gpu:9070':   { re: /RX 9070(?!\s*(XT|GRE))/i },
  'gpu:5070':   { re: /RTX 5070(?!\s*Ti)/i },
  'gpu:9070xt': { re: /RX 9070 XT/i },
  'gpu:5070ti': { re: /RTX 5070 Ti/i },
  'gpu:5080':   { re: /RTX 5080(?!\s*Super)/i },
  'gpu:5090':   { re: /RTX 5090/i },
};

const ilanlar = await tara('ekran-karti', 8);
if (ilanlar.length < 100) { console.error('Epey taraması eksik (' + ilanlar.length + ' ilan); bugün karar verilmedi.'); process.exit(1); }

/* 27.09.2026: Bizim modelin CANLI fiyatı sitede gösterilenden %15'ten fazla
   yüksekse (bot ani sıçramayı 3 gün bekletiyor) sitede yanlış, düşük fiyat
   duruyor demektir. RTX 5060 (23.09) ve RTX 5080 (25-27.09) böyle oldu. Bu
   durumda 3 gün beklenmez: ACİL uyarı verilir, bildirim.ps1 bildirim çıkarır. */
const ESLESME = JSON.parse(readFileSync(new URL('scripts/epey-eslesme.json', kok), 'utf8'));
const oneriler = [], izlenen = [], acil = [];
for (const [anahtar, y] of Object.entries(YONGA)) {
  const bizim = fiyat[anahtar];
  const uygun = ilanlar.filter(x => y.re.test(x.ad) && x.satici >= MIN_SATICI && (!y.bellek || y.bellek.test(x.ad)))
                       .sort((a, b) => a.fiyat - b.fiyat);
  if (!bizim || !uygun.length) continue;
  const enUcuz = uygun[0];
  const d = durum[anahtar] || {};
  // Aynı model dün de en ucuzsa seri uzar, değilse sıfırlanır
  const seri = (d.model === enUcuz.ad && d.son !== bugun) ? (d.seri || 1) + 1 : (d.model === enUcuz.ad ? (d.seri || 1) : 1);
  durum[anahtar] = { model: enUcuz.ad, fiyat: enUcuz.fiyat, satici: enUcuz.satici, link: enUcuz.link, seri, son: bugun };
  const bizimIlan = ilanlar.find(x => x.link === ESLESME[anahtar]);
  if (bizimIlan && bizimIlan.fiyat > bizim.fiyat * 1.15)
    acil.push(`${anahtar}: modelimizin fiyatı ${bizim.fiyat} -> ${bizimIlan.fiyat} TL (%${Math.round((bizimIlan.fiyat / bizim.fiyat - 1) * 100)}); sitede eski fiyat görünüyor.` +
      (enUcuz.link !== bizimIlan.link ? `\n    En ucuz uygun model: ${enUcuz.ad} — ${enUcuz.fiyat} TL (${enUcuz.satici} satıcı)\n    ${enUcuz.link}` : ''));
  const bizimAd = String(bizim.ad || '');
  const ayniModel = bizimAd && enUcuz.ad.toLowerCase().includes(bizimAd.replace(/.*\(|\).*/g, '').toLowerCase().split(' ')[0]) &&
                    Math.abs(enUcuz.fiyat - bizim.fiyat) < 1;
  const fark = Math.round((1 - enUcuz.fiyat / bizim.fiyat) * 100);
  if (ayniModel || fark < ESIK) continue;
  if (seri >= GUN) oneriler.push(`${anahtar}: ${enUcuz.ad} — ${enUcuz.fiyat} TL (${enUcuz.satici} satıcı), bizimkinden %${fark} ucuz, ${seri} gündür en ucuz\n    ${enUcuz.link}`);
  else izlenen.push(`${anahtar}: ${enUcuz.ad} — %${fark} ucuz, ${seri}/${GUN}. gün (henüz değiştirme)`);
}
writeFileSync(DURUM, JSON.stringify(durum, null, 2) + '\n');
console.log(`Model izleme ${bugun} — ${Object.keys(YONGA).length} yonga`);
if (acil.length) console.log('\nACİL MODEL KONTROLÜ (sitede yanlış fiyat):\n  ' + acil.join('\n  '));
if (oneriler.length) console.log('\nMODEL DEĞİŞTİRİLEBİLİR (3 gün doğrulandı):\n  ' + oneriler.join('\n  '));
if (izlenen.length) console.log('\nİZLENİYOR:\n  ' + izlenen.join('\n  '));
if (!acil.length && !oneriler.length && !izlenen.length) console.log('Bütün modeller kurala uygun.');
