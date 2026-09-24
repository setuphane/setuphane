/* Fiyat geçmişi: node scripts/fiyat-gecmis.mjs
   fiyatlar.json'un git geçmişinden her parça için GÜNLÜK fiyat dizisi çıkarır
   ve fiyat-gecmis.json'a yazar (son 90 gün). Günlük bot her sabah çalıştırır.

   Kurallar (BİRİNCİ KURAL: uydurma yok):
   - Her gün için o günün SON kaydı alınır.
   - Bir parçanın modeli değiştiyse (ad farklı) eski modelin fiyatları diziden
     düşer: başka bir ürünün fiyatıyla "en düşük" demek yanlış olur.
   - Sitede ancak en az ASGARI_GUN günlük veri varsa gösterilir (site tarafında). */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const kok = new URL('..', import.meta.url);
const git = (...a) => execFileSync('git', a, { cwd: kok, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const GUN = 90;

const kayitlar = git('log', '--format=%H %cI', '--', 'fiyatlar.json').trim().split('\n').filter(Boolean)
  .map(s => { const [h, t] = s.split(' '); return { h, gun: t.slice(0, 10) }; });
// Her gün için en yeni commit (git log yeniden eskiye sıralı)
const gunluk = new Map();
for (const k of kayitlar) if (!gunluk.has(k.gun)) gunluk.set(k.gun, k.h);
const gunler = [...gunluk.keys()].sort().slice(-GUN);

const seri = {};   // anahtar -> [{gun, fiyat, ad}]
for (const gun of gunler) {
  let veri;
  try { veri = JSON.parse(git('show', gunluk.get(gun) + ':fiyatlar.json')).parcalar || {}; } catch { continue; }
  for (const [anahtar, v] of Object.entries(veri)) {
    if (!v || !(v.fiyat > 0)) continue;
    (seri[anahtar] = seri[anahtar] || []).push({ gun, fiyat: v.fiyat, ad: v.ad || '' });
  }
}
// Model değişimi: yalnız GÜNCEL modelin kesintisiz son dilimi kalır
const parcalar = {};
for (const [anahtar, s] of Object.entries(seri)) {
  const ad = s[s.length - 1].ad;
  let i = s.length - 1;
  while (i > 0 && s[i - 1].ad === ad) i--;
  parcalar[anahtar] = { ad, noktalar: s.slice(i).map(x => [x.gun, x.fiyat]) };
}
const cikti = { guncelleme: new Date().toISOString().slice(0, 10), gunSayisi: gunler.length, parcalar };
writeFileSync(new URL('fiyat-gecmis.json', kok), JSON.stringify(cikti) + '\n');
const enUzun = Math.max(0, ...Object.values(parcalar).map(p => p.noktalar.length));
console.log(`Fiyat geçmişi: ${gunler.length} gün, ${Object.keys(parcalar).length} parça, en uzun seri ${enUzun} gün.`);
