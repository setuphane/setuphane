/* Laptop ekran karti guc degerlerini OLCUME baglar.
     node scripts/laptop-gpu-guncelle.mjs

   Kaynak: NotebookCheck'in her mobil GPU sayfasindaki gercek oyun
   testleri (ultra, 1920x1080). Yontem:
   1. RTX 4080 Laptop merkez alindi; her kartin ona orani, IKISINDE DE
      olculmus oyunlar uzerinden hesaplandi.
   2. Ortalama degil MEDYAN kullanildi. Ortalama tek bir bozuk olcumden
      cok etkileniyordu: Forza Horizon 6'da RTX 5070 icin 23 fps, RTX 4080
      icin 59 fps yaziyor — bu imkansiz (tek laptop ornegi / dusuk TGP).
      Medyandan 1,6 kat sapan olcumler de elendi.
   3. Olcek capasi RTX 4060 Laptop = 52; bu deger gercek oyun FPS'iyle
      dogrulandi (52 x 0.86 = 45 fps, olculen agir oyun ortalamasiyla ayni).

   Onceki degerler tahmindi ve tamami YUKSEKTI, en cok da ust segmentte
   (RTX 5090 Laptop 110 -> 91). Masaustunde bulunan sapmanin aynisi.

   NOT: RTX 5050 ve RTX 5060 Laptop icin yeterli olcum yok; o kartlari
   kullanan laptoplar listeden cikarildi. Olcumu olmayan karta puan
   uydurmuyoruz. */
import { readFileSync, writeFileSync } from 'node:fs';

/* Kart -> RTX 4080 Laptop'a olculmus oran (medyan) */
const ORAN = {
  'rtx 3060': 0.5067, 'rtx 4060': 0.7360, 'rtx 4070': 0.8243,
  'rtx 5070': 0.8478, 'rtx 4080': 1.0000, 'rtx 5070 ti': 1.0464,
  'rtx 5080': 1.2036, 'rtx 4090': 1.2350, 'rtx 5090': 1.2885,
};
/* Capa RTX 4080 Laptop: en guclu ornekleme onda (15 agir 2025-26 basligi,
   ultra 1080p medyani 63,3 fps). Modelimizde cok agir oyun katsayisi 0.86,
   dolayisiyla puani 63.3/0.86 = 73.6. */
const CAPA = 63.3 / 0.86;
const PUAN = {};
for (const k of Object.keys(ORAN)) PUAN[k] = Math.round(ORAN[k] * CAPA);

const p = 'src/setuphane.html';
let s = readFileSync(p, 'utf8');
const NL = String.fromCharCode(10);
const bas = s.indexOf('const LAPTOPS=[');
const son = s.indexOf(NL + '];', bas);
const satirlar = s.slice(bas, son).split(NL);

let degisen = 0;
const eksik = new Set();
for (let i = 0; i < satirlar.length; i++) {
  if (!/^\s*\{name:/.test(satirlar[i])) continue;
  const g = satirlar[i].match(/gpu:'([^']+)'/);
  if (!g) continue;
  const yeni = PUAN[g[1]];
  if (yeni == null) { eksik.add(g[1]); continue; }
  const eski = satirlar[i].match(/,idx:(\d+)/);
  if (eski && +eski[1] !== yeni) degisen++;
  satirlar[i] = satirlar[i].replace(/,idx:\d+/, ',idx:' + yeni);
}
s = s.slice(0, bas) + satirlar.join(NL) + s.slice(son);
writeFileSync(p, s);

console.log('Yeni laptop kart puanlari:');
for (const k of Object.keys(PUAN)) console.log('  ' + k.padEnd(12) + PUAN[k]);
console.log(`\n${degisen} laptop satiri guncellendi.`);
if (eksik.size) console.log('OLCUMU OLMAYAN KART: ' + [...eksik].join(', '));
