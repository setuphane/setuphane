// Elle inceleme:  EPEY_DIR=... node scripts/epey-ara.mjs <kategori> <kelime> [kelime...]
import { readFileSync } from 'node:fs';
const [kat, ...kel] = process.argv.slice(2);
const v = JSON.parse(readFileSync(`${process.env.EPEY_DIR}/${kat}.json`, 'utf8'));
const sd = t => t.toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
  .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');
v.filter(x => kel.every(k => k.startsWith('!') ? !sd(x.ad).includes(sd(k.slice(1))) : sd(x.ad).includes(sd(k))))
 .sort((a,b)=>a.fiyat-b.fiyat).slice(0,10)
 .forEach(x => console.log(`${String(x.fiyat).padStart(9)} | ${String(x.satici).padStart(2)} sat | ${x.ad}`));
