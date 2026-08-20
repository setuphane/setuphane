// Kategorileri tarayip scratchpad'e JSON yazar. Fiyat denetiminin ham verisi.
import { tara } from './epey-tara.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const dizin = process.env.EPEY_DIR;
mkdirSync(dizin, { recursive: true });
const isler = [
  ['ekran-karti', 16], ['islemci', 10], ['anakart', 14], ['bellek-ram', 10],
  ['sabit-disk', 10], ['power-supply-psu', 8], ['islemci-sogutucu', 8],
  ['bilgisayar-kasasi', 10],
];
for (const [slug, n] of isler) {
  const v = await tara(slug, n);
  writeFileSync(`${dizin}/${slug}.json`, JSON.stringify(v));
  console.log(`${slug.padEnd(20)} ${String(v.length).padStart(4)} urun`);
}
