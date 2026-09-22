/* .oem-ikiz.json -> src/setuphane.html içindeki OEM_SISTEMLER (OEM:BEGIN/END).
     node scripts/oem-yaz.mjs
   Seçim kuralları:
   1. İşlemci VE kart sitenin kataloğunda olmalı: FPS iki taraf için de AYNI
      ölçekle (motorun CPUS.g / GPUS.idx) hesaplansın. 22.09.2026 öncesi OEM
      tarafı eski bir işlemci ölçeği kullanıyordu (7500F: 74, motor: 93) ve
      işlemcinin sınırladığı oyunlarda hazır sistemi haksız yere düşük
      gösteriyordu. Katalog dışı işlemciye tahmini puan VERİLMEZ.
   2. Monitör/çevre birimi içeren "SET" paketler çıkar (kıyas haksız olur).
   3. 60 bin üstünde en az 12 GB VRAM; işlemci/kart dengesi aşırı bozuk değil.
   4. Her bütçe bandında, her mağaza için EN GÜÇLÜ, eşitse EN UCUZ paket —
      rakibin en iyi teklifiyle kıyaslıyoruz, pahalı paketlerle değil.       */
import { readFileSync, writeFileSync } from 'node:fs';
const NL = String.fromCharCode(10);
const s0 = readFileSync('src/setuphane.html', 'utf8');
const dizi = a => { const i = s0.indexOf('const ' + a + '=['), j = s0.indexOf('\n];', i);
  return new Function('Infinity', 'return ' + s0.slice(i + ('const ' + a + '=').length, j + 2).replace(/\r/g, ''))(Infinity); };
const GPUS = dizi('GPUS'), CPUS = dizi('CPUS');
const sd = t => t.toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/\s+/g, ' ').trim();
const cpuAnahtar = t => sd(t).replace(/\(.*?\)/g, '').replace(/işlemci|islemci/g, '')
  .replace(/\b(amd|intel|core)\b/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
const KOD_GPU = { 'rtx 5060': '5060', 'rtx 5060 ti': '5060ti', 'rtx 5070': '5070', 'rtx 5070 ti': '5070ti', 'rtx 5080': '5080',
  'rtx 5090': '5090', 'rx 9060 xt': '9060xt', 'rx 9070': '9070', 'rx 9070 xt': '9070xt' };

const hepsi = JSON.parse(readFileSync('.oem-ikiz.json', 'utf8'));
const elendi = {};
const at = (x, n) => { elendi[n] = (elendi[n] || 0) + 1; return false; };
const uygun = hepsi.map(o => {
  const c = CPUS.find(x => cpuAnahtar(x.n) === cpuAnahtar(o.cpu));
  const g = GPUS.find(x => x.id === KOD_GPU[o.chip]);
  return { ...o, c, g };
}).filter(o => {
  if (!o.c) return at(o, 'işlemci katalog dışı (FPS ölçeği yok)');
  if (!o.g) return at(o, 'kart katalog dışı');
  if (/\bset\b|monit|klavye|mouse|kulakl/i.test(o.ad + ' ' + (o.baslik || ''))) return at(o, 'çevre birimli set');
  const vram = o.vram || o.g.vram;
  if (o.fiyat >= 60000 && vram < 12) return at(o, 'VRAM < 12 GB (60 bin üstü)');
  const oran = (o.c.g * 1.32) / o.g.idx;
  if (oran < 0.8 || oran > 2.2) return at(o, 'işlemci/kart dengesi bozuk');
  return true;
});

const BANT = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 175, 190, 200, 225, 250, 300, 350, 400, 450, 520].map(x => x * 1000);
const secilen = [];
let alt = 0;
for (const ust of BANT) {
  for (const magaza of ['İtopya', 'İncehesap']) {
    const aday = uygun.filter(o => o.magaza === magaza && o.fiyat > alt && o.fiyat <= ust)
      .sort((a, b) => b.g.idx - a.g.idx || b.c.g - a.c.g || a.fiyat - b.fiyat);
    if (aday[0]) secilen.push(aday[0]);
  }
  alt = ust;
}
console.log(`${hepsi.length} ikiz -> ${uygun.length} kurallardan geçti -> ${secilen.length} seçildi`);
Object.entries(elendi).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}x ${k}`));
for (const o of secilen) {
  const f = Math.round((o.fiyat - o.ikiz.toplam) / o.fiyat * 100);
  console.log(`  ${String(o.fiyat).padStart(7)} ${o.magaza.padEnd(9)} ${o.ad.slice(0, 22).padEnd(22)} ${o.c.n.padEnd(16)} ${o.g.id.padEnd(7)} ikiz ${String(o.ikiz.toplam).padStart(7)}  %${f}`);
}

const t = v => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const tarih = new Date().toLocaleDateString('tr-TR');
const govde = secilen.map(o => {
  const p = o.ikiz.parca.map(([tur, ad, fy]) => `[${t(tur)},${t(ad)},${fy}]`).join(',');
  const kart = o.chip.replace(/^rtx/, 'RTX').replace(/^rx/, 'RX').replace(/ ti$/, ' Ti').replace(/ xt$/, ' XT') + ' ' + (o.vram || o.g.vram) + ' GB';
  return ` {ad:${t(o.ad)}, fiyat:${o.fiyat}, magaza:${t(o.magaza)}, cpu:${t(o.c.n)}, kart:${t(kart)}, idx:${o.g.idx}, cpuIdx:${o.c.g},` +
    ` vram:${o.vram || o.g.vram}, ram:${o.ramTop}, ramAdet:${o.ramAdet}, ssd:${o.ssd},` + NL +
    `  gorsel:${t(o.gorsel || '')}, link:${t(o.link)},` + NL +
    `  ikiz:{toplam:${o.ikiz.toplam}, parca:[${p}],` + NL + `   notlar:[${o.ikiz.notlar.map(t).join(',')}]}},`;
}).join(NL);
const blok = `/* OEM:BEGIN — İtopya + İncehesap hazır sistemleri ve "ikizleri", ${tarih}.
   Üretim: scripts/itopya-tara.mjs + (tarayıcıdan) .incehesap.json -> scripts/oem-ikiz.mjs
   -> scripts/oem-yaz.mjs. İkiz: aynı işlemci, aynı kart çipi+VRAM, aynı RAM (modül
   sayısıyla), aynı SSD kapasitesi, aynı yonga seti; güç/kasa/soğutucu sitenin sert
   kurallarıyla. Her fiyat Epey'de 3+ satıcılı en ucuz ilan. Kurallar oem-yaz.mjs'de. */
const OEM_TARIHI=${t(tarih)};
const OEM_SISTEMLER=[
${govde}
];
/* OEM:END */`;
let s = readFileSync('src/setuphane.html', 'utf8');
const bas = s.indexOf('/* OEM:BEGIN'), son = s.indexOf('/* OEM:END */', bas) + '/* OEM:END */'.length;
if (bas < 0 || son < 20) throw new Error('OEM blok işaretleri bulunamadı');
const crlf = s.includes('\r\n');
s = s.slice(0, bas) + (crlf ? blok.split(NL).join('\r\n') : blok) + s.slice(son);
writeFileSync('src/setuphane.html', s);
console.log(secilen.length + ' sistem koda yazıldı');
