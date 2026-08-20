/* Laptop fiyat/satici guncellemesi icin SQL uretir:
     node scripts/laptop-sql.mjs > supabase-laptoplar-guncelle.sql
   Satir SILMEZ, EKLEMEZ; yalnizca fiyat ve satici sayisini gunceller.
   Anahtar olarak tam ad kullaniliyor (laptoplar_ad_uniq zaten var). */
import { readFileSync } from 'node:fs';
const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const i = s.indexOf('const LAPTOPS=['), j = s.indexOf('\n];', i);
const L = new Function('return ' + s.slice(i + 'const LAPTOPS='.length, j + 2))();
const q = v => "'" + String(v).replace(/'/g, "''") + "'";

console.log('-- Laptop fiyat ve satici sayisi guncellemesi');
console.log('-- Uretildi: node scripts/laptop-sql.mjs   (kaynak: src/setuphane.html)');
console.log('-- Satir silmez/eklemez; yalnizca fiyat ve saticilar alanlarini gunceller.');
console.log('update laptoplar as l set fiyat = y.fiyat, saticilar = y.saticilar');
console.log('from (values');
console.log(L.map(x => `  (${q(x.name)}, ${x.price}, ${x.offers || 0})`).join(',\n'));
console.log(') as y(ad, fiyat, saticilar)');
console.log('where l.ad = y.ad;');
console.log("\nnotify pgrst, 'reload schema';");
