/* Gun sonu genel testi — "Sistem Kur" sayfasi.
     node scripts/gun-sonu-testi.mjs
   Sert kurallari kombinasyon-denetimi.mjs zaten tariyor. Bu arac ondan
   farkli olarak ZIYARETCININ GORDUGU tutarliligi sinar. */
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const dizi = a => { const i=s.indexOf('const '+a+'=['), j=s.indexOf('\n];',i);
  return new Function('Infinity','return '+s.slice(i+('const '+a+'=').length,j+2))(Number.POSITIVE_INFINITY); };
const nesne = a => { const i=s.indexOf('const '+a+'={'), j=s.indexOf('\n};',i);
  return new Function('return '+s.slice(i+('const '+a+'=').length,j+2))(); };
const parca = (a,b) => s.slice(s.indexOf(a), s.indexOf(b));

const ortam = { GPUS:dizi('GPUS'), CPUS:dizi('CPUS'), RAMS:dizi('RAMS'), SSDS:dizi('SSDS'),
  PSUS:dizi('PSUS'), COOLERS:dizi('COOLERS'), CASES:dizi('CASES'), BOARDS:nesne('BOARDS'),
  GAMES:dizi('GAMES'), RES:dizi('RES') };
const k = new Function(...Object.keys(ortam),
  'const BUD_MIN=18000, BUD_MAX=1000000;' +
  'const cpuBrand=c=>c.plat==="AM5"?"AMD":"Intel";' +
  parca('/* Bellek puanı','const PROFILES=') +
  parca('const PROFILES=','/* ═══════════════════ hesap motoru') +
  parca('function pickBoard(','/* FPS ölçeği') +
  'return {buildSystem, PROFILES, fps, resKat, tatliNokta};')(...Object.values(ortam));

const { buildSystem, PROFILES, fps, tatliNokta } = k;
const { GAMES, RES } = ortam;
const tl = n => n.toLocaleString('tr-TR') + ' TL';
const hatalar = [];
const not = (baslik, metin) => hatalar.push(baslik + ' :: ' + metin);

const butceler = [];
for (let i=0;i<=120;i++) butceler.push(Math.round(18000*Math.pow(1000000/18000, i/120)));
const markalar = [['',''],['AMD',''],['Intel',''],['','NVIDIA'],['','AMD'],['AMD','AMD'],['Intel','NVIDIA']];

// 1. Butce artinca performans dusuyor mu? Gorunur ve utandirici hata sinifi.
console.log('1) Butce artinca performans dusuyor mu?');
let dusus = 0;
for (const prof of PROFILES) {
  if (!prof.needGpu) continue;
  for (const [pc,pg] of markalar)
    for (const oyun of [GAMES.find(g=>g.id==='cyber'), GAMES.find(g=>g.id==='cs2')])
      for (const res of RES) {
        let oncekiF = 0, oncekiB = 0;
        for (const b of butceler) {
          const x = buildSystem(b, prof, {cpu:pc, gpu:pg});
          if (!x) continue;
          const f = fps(x.g, x.c, oyun, res);
          if (f < oncekiF - 0.5) {
            dusus++;
            if (dusus <= 6) not('performans-dususu',
              prof.id+'/'+(pc||'-')+'+'+(pg||'-')+'/'+oyun.id+'/'+res.id+': '+
              tl(oncekiB)+' -> '+tl(b)+' arasinda '+oncekiF+' FPS iken '+f+' FPS');
          }
          oncekiF = f; oncekiB = b;
        }
      }
}
console.log(dusus ? '   '+dusus+' dusus bulundu' : '   temiz');

// 2. Ekranda yazan FPS, min(kart siniri, islemci siniri) ile ayni mi?
console.log('2) FPS hesabi tutarli mi?');
let tutarsiz = 0;
for (const prof of PROFILES) {
  if (!prof.needGpu) continue;
  for (const b of butceler) {
    const x = buildSystem(b, prof, {cpu:'', gpu:''});
    if (!x) continue;
    for (const oyun of GAMES) for (const res of RES) {
      const kartSinir = x.g.idx * res.mul * k.resKat(x.g,res) * oyun.k *
                        ((x.g.vram && x.g.vram<oyun.vram)?0.82:1);
      const cpuSinir = x.c.g * oyun.ck;
      const beklenen = Math.max(12, Math.round(Math.min(kartSinir, cpuSinir)));
      const f = fps(x.g, x.c, oyun, res);
      if (f !== beklenen) {
        tutarsiz++;
        if (tutarsiz <= 3) not('fps-tutarsiz', tl(b)+'/'+prof.id+'/'+oyun.id+'/'+res.id+
          ': gosterilen '+f+', beklenen '+beklenen);
      }
    }
  }
}
console.log(tutarsiz ? '   '+tutarsiz+' tutarsizlik' : '   temiz');

// 3. Marka kisiti secilince istenen marka geliyor mu, butce asiliyor mu?
console.log('3) Marka kisiti ve butce siniri');
let markaSorun = 0;
for (const prof of PROFILES) for (const b of butceler) for (const [pc,pg] of markalar) {
  const x = buildSystem(b, prof, {cpu:pc, gpu:pg});
  if (!x) continue;
  if (pc && (pc==='AMD') !== (x.c.plat==='AM5')) { markaSorun++; not('marka-islemci', tl(b)+' '+pc+' istendi, '+x.c.n+' geldi'); }
  if (pg && x.g.id!=='igpu' && x.g.b !== pg)     { markaSorun++; not('marka-kart', tl(b)+' '+pg+' istendi, '+x.g.n+' geldi'); }
  if (x.total > b)                                { markaSorun++; not('butce-asimi', tl(b)+' butce, '+tl(x.total)+' sistem'); }
}
console.log(markaSorun ? '   '+markaSorun+' sorun' : '   temiz');

// 4. Tatli nokta paneli kendi onerisiyle celisiyor mu?
console.log('4) Tatli nokta paneli tutarli mi?');
let tatliSorun = 0, tatliSayi = 0;
for (const prof of PROFILES) {
  if (!prof.needGpu) continue;
  for (const b of butceler)
    for (const oyun of [GAMES.find(g=>g.id==='cyber'), GAMES.find(g=>g.id==='valorant')])
      for (const res of [RES[0], RES[1]]) {
        const t = tatliNokta(b, prof, {cpu:'',gpu:''}, oyun, res);
        if (!t) continue;
        tatliSayi++;
        const tam = buildSystem(b, prof, {cpu:'',gpu:''});
        const tamF = fps(tam.g, tam.c, oyun, res);
        if (t.ucuz.total >= tam.total) { tatliSorun++; not('tatli-daha-pahali', tl(b)+': onerilen '+tl(t.ucuz.total)); }
        if (t.ucuzFps < tamF*0.97)     { tatliSorun++; not('tatli-daha-yavas', tl(b)+': '+t.ucuzFps+' < '+tamF); }
        if (t.tasarruf !== tam.total - t.ucuz.total) { tatliSorun++; not('tatli-tasarruf-yanlis', tl(b)); }
      }
}
console.log(tatliSorun ? '   '+tatliSorun+' sorun / '+tatliSayi+' panel' : '   temiz ('+tatliSayi+' panel uretildi)');

// 5. Profillerin en dusuk kurulabilir butcesi
console.log('5) Profillerin en dusuk kurulabilir butcesi:');
for (const prof of PROFILES) {
  const ilk = butceler.find(b => buildSystem(b, prof, {cpu:'',gpu:''}));
  const x = ilk ? buildSystem(ilk, prof, {cpu:'',gpu:''}) : null;
  console.log('   '+prof.id.padEnd(8)+' '+(ilk?tl(ilk).padStart(12):'kurulamiyor')+
    (x ? '  -> '+x.g.n.slice(0,32)+' + '+x.c.n : ''));
}

console.log('\n' + '-'.repeat(66));
if (!hatalar.length) console.log('SONUC: Sistem Kur sayfasinda tutarsizlik bulunamadi.');
else { console.log('SONUC: '+hatalar.length+' bulgu'); hatalar.slice(0,14).forEach(h=>console.log('  * '+h)); }
