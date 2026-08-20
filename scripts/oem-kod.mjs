/* .oem-secilen.json -> src/setuphane.html icindeki OEM_SISTEMLER dizisi.
   Elle kopyalamak yerine uretiyoruz ki tarama tekrar kosuldugunda liste
   tek komutla tazelensin ve yazim hatasi girmesin. */
import { readFileSync, writeFileSync } from 'node:fs';
const NL = String.fromCharCode(10);
const v = JSON.parse(readFileSync('.oem-secilen.json', 'utf8'));
const t = s => "'" + String(s).replace(/'/g, "\'") + "'";

const govde = v.map(o => ` {ad:${t(o.ad)}, fiyat:${o.fiyat}, magaza:${t(o.magaza)},` +
  ` cpu:${t(o.cpu)}, kart:${t(o.kart)}, idx:${o.idx}, cpuIdx:${o.cpuIdx},` +
  ` vram:${o.vram}, ram:${o.ram}, ssd:${o.ssd},` + NL +
  `  gorsel:${t(o.gorsel)},` + NL + `  link:${t(o.url)}},`).join(NL);

const blok = `/* OEM:BEGIN — İncehesap hazır sistemleri, 20.08.2026.
   Seçim scripts/oem-sec.mjs ile yapıldı: DDR5 şartı (AM4/DDR4 ölü platform),
   60 bin üstünde en az 12 GB VRAM, ve işlemci/kart dengesi. 182 paketten
   95'i kurallardan geçti; her bütçe bandının en güçlüsü alındı.
   220 / 300 / 350 / 400 bin bantları boş: İncehesap'ta o aralıkta OEM yok. */
const OEM_SISTEMLER=[
${govde}
];
/* OEM:END */`;

const p = 'src/setuphane.html';
let s = readFileSync(p, 'utf8');
const bas = s.indexOf('/* OEM:BEGIN');
if (bas >= 0) {
  const son = s.indexOf('/* OEM:END */', bas) + '/* OEM:END */'.length;
  s = s.slice(0, bas) + blok + s.slice(son);
} else {
  const yer = s.indexOf('/* LAPTOPS:END */') + '/* LAPTOPS:END */'.length;
  if (yer < 20) throw new Error('LAPTOPS:END bulunamadi');
  s = s.slice(0, yer) + NL + NL + blok + s.slice(yer);
}
writeFileSync(p, s);
console.log(v.length + ' OEM sistem koda yazildi');
