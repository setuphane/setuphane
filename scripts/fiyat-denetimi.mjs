/* Fiyat denetimi:  EPEY_DIR=... node scripts/fiyat-denetimi.mjs
   Katalogdaki her parca icin Epey'de o SINIFIN en ucuz, yeterli saticili
   modelini bulur ve bizim fiyatimizla karsilastirir.
   Kural: en az 3 satici. Tek/iki saticili ilanlar ya stok disi ya da
   fahis; oralari baz alirsak ziyaretciye bulamayacagi fiyat gostermis
   oluruz — sitenin itibari icin en tehlikeli hata bu. */
import { readFileSync } from 'node:fs';

const dizin = process.env.EPEY_DIR;
const oku = s => JSON.parse(readFileSync(`${dizin}/${s}.json`, 'utf8'));
const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const dizi = a => { const i = s.indexOf('const ' + a + '=['), j = s.indexOf('\n];', i);
  return new Function('return ' + s.slice(i + ('const ' + a + '=').length, j + 2))(); };

const MIN_SATICI = 3;
/* Kelimeler DUZ METIN degil DUZENLI IFADE olarak eslesiyor. Duz metin
   kullaninca urun kodundaki rakamlar filtreyi bozuyordu: 16 GB ariyoruz
   ama "(TMD532GB6000U36)" kodundaki "32" yuzunden ilan eleniyordu.
   Ayni sekilde 16 GB'lik bir kartin yerine 8 GB'lik surumu gecmesin diye
   kapasite de zorunlu kosul. */
const KURAL = {
  GPUS: ['ekran-karti', {
    '7600':   [[/\brx 7600\b/], [/\bxt\b/, /7600s/]],
    '5060':   [[/\brtx 5060\b/, /\b8\s?gb?\b/], [/\bti\b/]],
    '9060xt': [[/\brx 9060 xt\b/, /\b16\s?gb?\b/], []],
    '5060ti': [[/\brtx 5060 ti\b/, /\b16\s?gb?\b/], []],
    '9070':   [[/\brx 9070\b/, /\b16\s?gb?\b/], [/\bxt\b/, /\bgre\b/]],
    '5070':   [[/\brtx 5070\b/, /\b12\s?gb?\b/], [/\bti\b/]],
    '9070xt': [[/\brx 9070 xt\b/, /\b16\s?gb?\b/], []],
    '5070ti': [[/\brtx 5070 ti\b/, /\b16\s?gb?\b/], []],
    '5080':   [[/\brtx 5080\b/, /\b16\s?gb?\b/], []],
    '5090':   [[/\brtx 5090\b/, /\b32\s?gb?\b/], []],
  }],
  CPUS: ['islemci', {
    '8500g':   [[/ryzen 5 8500g\b/], []],
    '7500f':   [[/ryzen 5 7500f\b/], []],
    '7600':    [[/ryzen 5 7600\b/], [/7600x/, /3d/]],
    '245k':    [[/ultra 5 245k\b/], [/245kf/]],
    '9600x':   [[/ryzen 5 9600x\b/], [/3d/]],
    '9700x':   [[/ryzen 7 9700x\b/], [/3d/]],
    '265k':    [[/ultra 7 265k\b/], [/265kf/]],
    '7800x3d': [[/ryzen 7 7800x3d\b/], []],
    '9800x3d': [[/ryzen 7 9800x3d\b/], []],
    '285k':    [[/ultra 9 285k\b/], [/285kf/]],
    '9950x3d': [[/ryzen 9 9950x3d\b/], []],
  }],
  RAMS: ['bellek-ram', {
    '16': [[/\bddr5\b/, /\b16 gb\b/, /\b6000\b/], [/so-?dimm/]],
    '32': [[/\bddr5\b/, /\b32 gb\b/, /\b6000\b/], [/so-?dimm/]],
    '64': [[/\bddr5\b/, /\b64 gb\b/, /\b6000\b/], [/so-?dimm/]],
  }],
  SSDS: ['sabit-disk', {
    '500': [[/\bssd\b/, /\b500 gb\b/, /\bm\.?2\b|nvme/], [/harici|tasinabilir|sata/]],
    '1t':  [[/\bssd\b/, /\b1 tb\b/,   /\bm\.?2\b|nvme/], [/harici|tasinabilir|sata/]],
    '2t':  [[/\bssd\b/, /\b2 tb\b/,   /\bm\.?2\b|nvme/], [/harici|tasinabilir|sata/]],
  }],
  PSUS: ['power-supply-psu', {
    '550': [[/\b550\s?w\b/], []], '650': [[/\b650\s?w\b/], []],
    '800': [[/\b8[05]0\s?w\b/, /gold|platinum/], []],
    '850': [[/\b850\s?w\b/, /gold|platinum/], []],
    '1000':[[/\b1000\s?w\b/, /gold|platinum/], []],
    '1300':[[/\b1[23]00\s?w\b/, /gold|platinum/], []],
  }],
  COOLERS: ['islemci-sogutucu', {
    'air': [[/\bhava\b/], [/sivi/]],
    'aio': [[/\b240\b/, /sivi|likit|aio/], []],
  }],
  CASES: ['bilgisayar-kasasi', { '0': [[], []], '1': [[], []], '2': [[], []] }],
};

const sadelestir = t => t.toLowerCase()
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/\s+/g, ' ');

const tl = n => n.toLocaleString('tr-TR') + ' TL';
let uyari = 0, bakilan = 0;

for (const [ad, [kategori, kurallar]] of Object.entries(KURAL)) {
  const veri = oku(kategori).map(x => ({ ...x, k: sadelestir(x.ad) }));
  console.log(`\n══ ${ad}  (Epey/${kategori}, ${veri.length} kayit) ══`);
  for (const p of dizi(ad)) {
    const kural = kurallar[p.id];
    if (!kural) continue;
    const [olmali, olmamali] = kural;
    if (!olmali.length) { console.log(`   ${p.n} — elle bakilacak`); continue; }
    bakilan++;
    const eslesen = veri.filter(x => olmali.every(t => t.test(x.k))
                                  && !olmamali.some(t => t.test(x.k)));
    const yeterli = eslesen.filter(x => x.satici >= MIN_SATICI);
    if (!yeterli.length) {
      console.log(`  ?  ${p.n}\n       Epey'de ${MIN_SATICI}+ saticili karsilik YOK (${eslesen.length} ilan) — elle bak`);
      uyari++; continue;
    }
    const enUcuz = yeterli.reduce((a, b) => b.fiyat < a.fiyat ? b : a);
    const fark = (enUcuz.fiyat - p.p) / p.p;
    const isaret = Math.abs(fark) < 0.07 ? 'ok' : (fark < 0 ? 'UCUZ' : 'PAHALI');
    if (isaret !== 'ok') uyari++;
    console.log(`  ${isaret.padEnd(6)} bizde ${tl(p.p).padStart(12)}   Epey ${tl(enUcuz.fiyat).padStart(12)}  (%${(fark * 100).toFixed(0)})`);
    console.log(`         bizim : ${p.n}`);
    console.log(`         Epey  : ${enUcuz.ad}  [${enUcuz.satici} satici]`);
  }
}
console.log(`\n─ ${bakilan} parca bakildi, ${uyari} tanesi dikkat istiyor (esik %7) ─`);
