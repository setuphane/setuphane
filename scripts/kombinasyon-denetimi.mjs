// Kombinasyon denetimi:  node scripts/kombinasyon-denetimi.mjs
//
// Sitenin uretebilecegi TUM sistemleri tek tek kurar ve uyumluluk
// kurallarindan gecirir. Amac: ziyaretciye asla calismayacak ya da parcayi
// zorlayacak bir kombinasyon onerilmemesi.
//
// Sirat: once UYUM (calisir mi, guvenli mi), sonra fiyat/performans.
// Butce kaydiricisi logaritmik oldugu icin adimlari da oyle tariyoruz —
// duz artisla dusuk butceler seyrek orneklenirdi.
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const dizi = ad => {
  const i = s.indexOf('const ' + ad + '=[');
  const j = s.indexOf('\n];', i);
  return new Function('Infinity', 'return ' + s.slice(i + ('const ' + ad + '=').length, j + 2))(Number.POSITIVE_INFINITY);
};
const nesne = ad => {
  const i = s.indexOf('const ' + ad + '={');
  const j = s.indexOf('\n};', i);
  return new Function('return ' + s.slice(i + ('const ' + ad + '=').length, j + 2))();
};
const parca = (bas, son) => s.slice(s.indexOf(bas), s.indexOf(son));

const GPUS = dizi('GPUS'), CPUS = dizi('CPUS'), RAMS = dizi('RAMS'), SSDS = dizi('SSDS');
const PSUS = dizi('PSUS'), COOLERS = dizi('COOLERS'), CASES = dizi('CASES');
const BOARDS = nesne('BOARDS');

// Sitenin kendi fonksiyonlarini AYNEN kullaniyoruz — kopyalarsak denetim
// gercek davranisi degil, kopyayi test etmis olurdu.
const ortam = { GPUS, CPUS, RAMS, SSDS, PSUS, COOLERS, CASES, BOARDS };
const kur = new Function(...Object.keys(ortam),
  'const cpuBrand = c => c.plat==="AM5" ? "AMD" : "Intel";' +
  parca('const ramS =', 'const PROFILES=') +
  parca('const PROFILES=', '/* ═══════════════════ hesap motoru') +
  parca('function pickBoard(', 'function fps(') +
  'return {buildSystem, PROFILES, pickBoard, pickPsu, pickCooler, pickCase, cpuBrand:c=>c.plat==="AM5"?"AMD":"Intel"};'
)(...Object.values(ortam));

const { buildSystem, PROFILES, cpuBrand } = kur;

// ── Kurallar ───────────────────────────────────────────────────────────
// Her kural bir sistem alir, sorun varsa metin doner.
const KURALLAR = [
  ['guc-kaynagi', b => {
    // Kart + islemci disinda anakart/disk/fan ~100 W ceker; gecici sicramalar
    // icin %20 pay birakiyoruz. Bunun altinda sistem yuk altinda kapanir.
    const gerek = Math.round((b.g.tdp + b.c.tdp + 100) * 1.2);
    return b.psu.w < gerek ? `${b.psu.w} W yetersiz, en az ${gerek} W gerekiyor (${b.g.n} + ${b.c.n})` : null;
  }],
  ['radyator-kasa', b => {
    // Sert uyumluluk kurali: radyator kasaya sigmazsa sistem HIC kurulamaz.
    // Bunu butce bandinin kasayla denk gelmesine birakamayiz.
    if (b.cl.rad && b.cs.rad && b.cl.rad > b.cs.rad)
      return `${b.cl.rad} mm radyator ${b.cs.n} kasasina sigmaz (en fazla ${b.cs.rad} mm)`;
    return null;
  }],
  ['sogutucu', b => {
    if (b.cl.cap < b.c.tdp) return `${b.cl.n} (${b.cl.cap} W) ${b.c.n} icin yetersiz (${b.c.tdp} W)`;
    if (b.cl.id === 'stock' && b.c.tdp > 95) return `${b.c.n} (${b.c.tdp} W) kutu sogutucusuyla veriliyor`;
    return null;
  }],
  ['anakart', b => {
    if (b.mb.t <= 1 && b.c.tdp >= 105)
      return `${b.mb.n} giris seviyesi, ${b.c.n} (${b.c.tdp} W) icin guc katmani zayif`;
    return null;
  }],
  ['platform', b => {
    const l = BOARDS[b.c.plat] || [];
    return l.includes(b.mb) ? null : `${b.c.n} (${b.c.plat}) ile ${b.mb.n} uyusmuyor`;
  }],
  ['dahili-grafik', b => (b.g.id === 'igpu' && !b.c.ig) ? `${b.c.n} dahili grafige sahip degil` : null],
  ['butce', (b, butce) => b.total > butce ? `toplam ${b.total} > butce ${butce}` : null],
  ['anakart-kasa', b => {
    // Sert uyumluluk: ATX anakart micro-ATX kasaya girmez.
    const sira = {'ITX':1,'mATX':2,'ATX':3};
    if (b.mb.form && b.cs.formMax && sira[b.mb.form] > sira[b.cs.formMax])
      return `${b.mb.n} (${b.mb.form}) ${b.cs.n} kasasina sigmaz (en fazla ${b.cs.formMax})`;
    return null;
  }],
  ['kart-kasa', b => {
    // Sert uyumluluk: kart kasaya sigmazsa sistem hic kurulamaz.
    if (b.g.boy && b.cs.gpuMax && b.g.boy > b.cs.gpuMax)
      return `${b.g.n} (${b.g.boy} mm) ${b.cs.n} kasasina sigmaz (en fazla ${b.cs.gpuMax} mm)`;
    return null;
  }],
  ['ram-anakart', b => {
    // Sert uyumluluk: anakartin destekledigi bellek tipi ile RAM ayni olmali.
    // Bugun katalogun tamami DDR5; kural gelecekte bir DDR4 anakart/RAM
    // girdiginde sessizce kirilmayalim diye var.
    const mbTip = b.mb.ram || 'DDR5';
    const ramTip = b.r.tip || 'DDR5';
    if (mbTip !== ramTip)
      return `${b.mb.n} ${mbTip} istiyor, secilen bellek ${ramTip} (${b.r.n})`;
    return null;
  }],
  ['pcie-x4', b => {
    // Ayri ekran karti takilan sisteme x4 hatli islemci konamaz: kart
    // olculebilir sekilde yavaslar. Kagit ustunde uygun gorunen ama
    // gercekte zarar veren esleşme.
    if (b.g.id !== 'igpu' && b.c.x4)
      return `${b.c.n} ekran karti yuvasi x4; ${b.g.n} ile birlikte kullanilamaz`;
    return null;
  }],
  ['agir-darbogaz', (b, butce, prof, kur) => {
    if (b.g.id === 'igpu') return null;
    const r = (b.c.g * 1.32) / b.g.idx;
    if (r < 0.75) return `islemci ekran kartini besleyemiyor (oran ${r.toFixed(2)}) — ${b.c.n} + ${b.g.n}`;
    /* Esik profile gore degisir, cunku "asiri islemci" ancak OYUNDA israftir.
       Yayin (oyun + kayit) ve tasarimda (render) islemci gercekten is
       yapiyor; orada guclu islemci israf degil, isin ta kendisi. Bu ayrimi
       yapmazsak dogru sistemleri hata diye isaretler, gercek hatalari da
       gurultunun icinde kaybederiz. */
    const esik = prof.id === 'oyun' ? 2.6 : 3.5;
    if (r <= esik) return null;
    /* Dengesizlik ancak O BUTCEDE dengeli bir alternatif varsa kusurdur.
       Marka kisiti ve butce birlikte eli bagliyorsa motor elinden geleni
       yapmistir; onu hata saymak gercek hatalarin arasinda gurultu yaratir.
       Test: sistemin geri kalani sabitken, islemci+kart icin ayrilabilecek
       para ile orani 2.6 altina indiren bir ikili kuruluyor mu? */
    const kalan = butce - b.total;
    const kese = b.c.p + b.g.p + kalan;
    const cpular = CPUS.filter(c => !kur.pc || cpuBrand(c) === kur.pc);
    const kartlar = GPUS.filter(g => g.id !== 'igpu' && (!kur.pg || g.b === kur.pg));
    const varMi = cpular.some(c => kartlar.some(g =>
      c.p + g.p <= kese && (c.g * 1.32) / g.idx <= esik && g.idx >= b.g.idx));
    if (!varMi) return null;
    return `islemciye asiri harcanmis (oran ${r.toFixed(2)}) — ${b.c.n} + ${b.g.n}`;
  }],
  // 8 GB kart ancak DAHA IYISI O BUTCEYE SIGIYORSA kusurdur. Sigmiyorsa
  // motor elinden geleni yapmistir; onu hata saymak yanlis olur.
  ['vram', (b, butce, prof, kur) => {
    if (b.g.id === 'igpu' || !prof.needGpu || b.g.vram > 8) return null;
    const fark = b.g.p;
    // Marka kisiti varsa alternatif de o markadan olmali.
    const daha = kur.GPUS.filter(x => x.vram >= 12 && x.idx >= b.g.idx && (!kur.pg || x.b === kur.pg))
      .sort((a, c) => a.p - c.p)[0];
    if (!daha) return null;
    const yeniToplam = b.total - fark + daha.p;
    if (yeniToplam <= butce)
      return `${b.total} TL'lik sistemde ${b.g.vram} GB VRAM (${b.g.n}) — ${daha.n} sigiyordu`;
    return null;
  }],
  ['ram', b => (b.total > 120000 && b.r.gb <= 16) ? `${b.total} TL'lik sistemde ${b.r.gb} GB RAM` : null],
  ['disk', b => b.s.gb < 500 ? `${b.s.gb} GB disk cok kucuk` : null],
];

// ── Tarama ─────────────────────────────────────────────────────────────
const BUD_MIN = 18000, BUD_MAX = 1000000, ADIM = 400;   // logaritmik adim sayisi
const butceler = [];
for (let i = 0; i <= ADIM; i++)
  butceler.push(Math.round(BUD_MIN * Math.pow(BUD_MAX / BUD_MIN, i / ADIM)));

const cpuSecim = ['', 'AMD', 'Intel'], gpuSecim = ['', 'NVIDIA', 'AMD', 'Intel'];
const bulgular = {}, kullanim = {}, bosButce = [];
let toplam = 0;

const say = (k, v) => { (kullanim[k] = kullanim[k] || new Set()).add(v); };

for (const butce of butceler)
  for (const prof of PROFILES)
    for (const pc of cpuSecim)
      for (const pg of gpuSecim) {
        const b = buildSystem(butce, prof, { cpu: pc, gpu: pg });
        if (!b) { if (!pc && !pg) bosButce.push(butce + ' / ' + prof.id); continue; }
        toplam++;
        say('gpu', b.g.id); say('cpu', b.c.id); say('ram', b.r.id); say('ssd', b.s.id);
        say('psu', b.psu.id); say('sogutucu', b.cl.id); say('anakart', b.mb.n); say('kasa', b.cs.n);
        for (const [ad, f] of KURALLAR) {
          const m = f(b, butce, prof, {GPUS, pc, pg});
          if (m) {
            const k = ad + ' :: ' + m;
            (bulgular[k] = bulgular[k] || { adet: 0, ornek: null });
            bulgular[k].adet++;
            if (!bulgular[k].ornek) bulgular[k].ornek = `${butce} TL / ${prof.id}` + (pc || pg ? ` / ${pc || '-'}+${pg || '-'}` : '');
          }
        }
      }

console.log(`Denetlenen sistem: ${toplam}  (${butceler.length} butce x ${PROFILES.length} profil x ${cpuSecim.length}x${gpuSecim.length} marka)`);

const liste = Object.entries(bulgular).sort((a, b) => b[1].adet - a[1].adet);
if (!liste.length) console.log('\nUYUMSUZLUK BULUNAMADI.');
else {
  console.log(`\n── SORUNLAR (${liste.length} farkli) ──`);
  for (const [k, v] of liste) console.log(`  [${String(v.adet).padStart(5)}x] ${k}\n           ilk gorulen: ${v.ornek}`);
}

console.log('\n── HIC SECILMEYEN PARCALAR ──');
const hepsi = { gpu: GPUS.map(x => x.id), cpu: CPUS.map(x => x.id), ram: RAMS.map(x => x.id),
  ssd: SSDS.map(x => x.id), psu: PSUS.map(x => x.id), sogutucu: COOLERS.map(x => x.id),
  anakart: Object.values(BOARDS).flat().map(x => x.n), kasa: CASES.map(x => x.n) };
for (const [k, v] of Object.entries(hepsi)) {
  const kul = kullanim[k] || new Set();
  const yok = v.filter(x => !kul.has(x));
  console.log(`  ${k.padEnd(9)} ${v.length - yok.length}/${v.length} kullaniliyor` + (yok.length ? `  —  kullanilmayan: ${yok.join(', ')}` : ''));
}
if (bosButce.length) console.log(`\n── SISTEM KURULAMAYAN DURUMLAR (${bosButce.length}) ──\n  ` + bosButce.slice(0, 8).join('\n  '));
// ── Eksik olcumler ─────────────────────────────────────────────────────
// Sert kurallar ancak veri varsa calisir. Verisi olmayan parcayi sessizce
// gecmek, kuralin hic olmamasi kadar tehlikeli — burada gorunur kaliyor.
const eksikBoy = GPUS.filter(g => g.id !== 'igpu' && !g.boy);
if (eksikBoy.length) {
  console.log(`\n── UZUNLUGU OLCULMEMIS KARTLAR (${eksikBoy.length}) ──`);
  console.log('   Bu kartlarda "kasaya sigar mi" kurali uygulanamiyor.');
  eksikBoy.forEach(g => console.log('  ' + g.n));
}
