// Ornek sistemler:  node scripts/ornek-sistemler.mjs [profil]
// Secili butcelerde kurulan sistemi insan gozuyle okunacak sekilde yazar.
// Denetim araci kural ihlali arar; bu arac "makul mu" sorusunu sorar.
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const dizi = a => { const i = s.indexOf('const ' + a + '=['), j = s.indexOf('\n];', i);
  return new Function('Infinity', 'return ' + s.slice(i + ('const ' + a + '=').length, j + 2))(Number.POSITIVE_INFINITY); };
const nesne = a => { const i = s.indexOf('const ' + a + '={'), j = s.indexOf('\n};', i);
  return new Function('return ' + s.slice(i + ('const ' + a + '=').length, j + 2))(); };
const parca = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));

const env = { GPUS: dizi('GPUS'), CPUS: dizi('CPUS'), RAMS: dizi('RAMS'), SSDS: dizi('SSDS'),
  PSUS: dizi('PSUS'), COOLERS: dizi('COOLERS'), CASES: dizi('CASES'), BOARDS: nesne('BOARDS') };
const k = new Function(...Object.keys(env),
  'const cpuBrand=c=>c.plat==="AM5"?"AMD":"Intel";' +
  parca('const ramS =', 'const PROFILES=') +
  parca('const PROFILES=', '/* ═══════════════════ hesap motoru') +
  parca('function pickBoard(', 'function fps(') +
  'return {buildSystem, PROFILES};')(...Object.values(env));

const tl = n => n.toLocaleString('tr-TR') + ' TL';
const profAdi = process.argv[2] || 'oyun';
const prof = k.PROFILES.find(x => x.id === profAdi) || k.PROFILES[0];

const butceler = [35000, 45000, 55000, 70000, 90000, 120000, 160000, 220000, 350000, 500000];
console.log(`PROFIL: ${prof.n}\n`);
for (const b of butceler) {
  const x = k.buildSystem(b, prof, {});
  if (!x) { console.log(`${tl(b).padStart(14)}  ->  sistem kurulamiyor`); continue; }
  const oran = x.g.id === 'igpu' ? null : ((x.c.g * 1.32) / x.g.idx);
  console.log(`${tl(b).padStart(14)}  ->  ${tl(x.total)}  (kalan ${tl(b - x.total)})`);
  console.log(`   kart   ${x.g.n}  [${x.g.vram} GB]`);
  console.log(`   islemci ${x.c.n}  [${x.c.tdp} W]`);
  console.log(`   anakart ${x.mb.n}`);
  console.log(`   ram/ssd ${x.r.gb} GB / ${x.s.gb >= 1000 ? (x.s.gb / 1000) + ' TB' : x.s.gb + ' GB'}`);
  console.log(`   psu     ${x.psu.w} W (${tl(x.psu.p)})   sogutucu ${x.cl.n} (${tl(x.cl.p)})`);
  console.log(`   denge   ${oran ? 'oran ' + oran.toFixed(2) + (oran < 0.98 ? ' — islemci geride' : oran > 1.55 ? ' — kart sinirliyor' : ' — dengeli') : 'dahili grafik'}\n`);
}
