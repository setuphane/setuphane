/* Incehesap hazir sistem tarayicisi:
     node scripts/incehesap-tara.mjs [slug] [sayfa]
   Site her urun kartina data-product JSON'u gomuyor (id, ad, marka, fiyat,
   kategori). Bu yuzden HTML ayiklamaya gerek yok — dogrudan JSON okunuyor,
   yani sayfa tasarimi degisse bile tarayici kirilmiyor. */
import { execFileSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export function tara(slug = 'hazir-sistemler-fiyatlari', sayfa = 4) {
  const hepsi = new Map();
  for (let s = 1; s <= sayfa; s++) {
    const url = `https://www.incehesap.com/${slug}/` + (s > 1 ? `sayfa-${s}/` : '');
    let h;
    try { h = execFileSync('curl', ['-sS', '--compressed', '-L', '-A', UA,
      '-H', 'accept-language: tr-TR,tr;q=0.9', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
    catch (e) { console.error('  ! ' + url + ' -> ' + e.message.slice(0, 80)); break; }

    const oncekiSayi = hepsi.size;
    const coz = (metin) => { try { return JSON.parse(metin.replace(/&quot;/g,'"').replace(/&amp;/g,'&')); } catch (e) { return null; } };
    /* Urun linki data-product ile AYNI <a> etiketinde duruyor; ikisini tek
       desende yakaliyoruz. data-gaitem yalnizca bazi kartlarda var, ona
       guvenemiyoruz. */
    for (const m of h.matchAll(/href="(\/[^"#]+?)"[^>]*?data-product='([^']+)'/g)) {
      const o = coz(m[2]);
      if (!o || !o.id || !o.price) continue;
      o.url = 'https://www.incehesap.com' + m[1];
      hepsi.set(o.id, o);
    }
    for (const m of h.matchAll(/data-gaitem='([^']+)'/g)) {
      const g = coz(m[1]);
      if (!g || !hepsi.has(g.id)) continue;
      const o = hepsi.get(g.id);
      if (g.image) o.image = g.image;
      if (g.item_brand) o.powered = g.item_brand;
    }
    // Yeni urun gelmediyse sayfalama bitmistir; bosuna istek atmayalim.
    if (hepsi.size === oncekiSayi) break;
  }
  return [...hepsi.values()];
}

if (process.argv[1] && process.argv[1].endsWith('incehesap-tara.mjs')) {
  const v = tara(process.argv[2], +process.argv[3] || 4);
  console.error(`${v.length} urun`);
  const kat = {};
  v.forEach(x => kat[x.category] = (kat[x.category] || 0) + 1);
  console.error('kategoriler: ' + JSON.stringify(kat));
  v.sort((a, b) => a.price - b.price)
   .forEach(x => console.log(`${String(x.price).padStart(8)} | ${x.category} | ${x.name.slice(0, 90)}`));
}
