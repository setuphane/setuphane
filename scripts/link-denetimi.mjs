/* Aksesuar linklerinin canliligi:  node scripts/link-denetimi.mjs
   Aksesuarlarda fiyat tutmuyoruz (fiyat riski yok) ama olu bir link
   ziyaretciyi bos sayfaya goturur; itibar acisindan fiyat kadar onemli.

   Iki kaynak birden denetlenir: koddaki AKSESUAR_URUNLERI (Supabase
   erisilemezse devreye giren yedek) VE canli `urunler` tablosu (site
   normalde bunu gosterir). Once yalnizca kod yedegi denetleniyordu; panel
   uzerinden eklenen urunler (24.08.2026'da 80 tanesi) o yedekte hic yok,
   yani denetimin disinda kalmislardi — script "temiz" derken kapsamin
   cogunu atlamis olurdu. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { devNull } from 'node:os';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const i = s.indexOf('const AKSESUAR_URUNLERI={'), j = s.indexOf('\n};', i);
const K = new Function('return ' + s.slice(i + 'const AKSESUAR_URUNLERI='.length, j + 2))();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const urlM = s.match(/const SUPABASE=\{\s*url:'([^']+)'/);
const anonM = s.match(/anon:'([^']+)'/);
if (!urlM || !anonM) throw new Error('SUPABASE url/anon src/setuphane.html icinde bulunamadi');
const [, SB_URL] = urlM, [, SB_ANON] = anonM;

const kodUrunler = Object.entries(K).flatMap(([kat, l]) => l.map(u => ({ kat, ad: u.ad, link: u.link, kaynak: 'kod' })));

let dbUrunler = [];
try {
  const r = await fetch(`${SB_URL}/rest/v1/urunler?select=kat,ad,link&aktif=eq.true`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  dbUrunler = (await r.json()).map(u => ({ ...u, kaynak: 'db' }));
} catch (e) {
  console.log(`UYARI: canli veritabani okunamadi (${e.message}) — sadece kod yedegi denetleniyor.\n`);
}

// Ayni link hem kodda hem veritabaninda olabilir (55 eski urun) — tek sefer denetlensin.
const gorulen = new Map();
for (const u of [...kodUrunler, ...dbUrunler]) {
  const onceki = gorulen.get(u.link);
  if (onceki) onceki.kaynak = 'ikisi de';
  else gorulen.set(u.link, u);
}
const urunler = [...gorulen.values()];

console.log(`${urunler.length} benzersiz aksesuar linki denetleniyor `
  + `(kod yedek: ${kodUrunler.length}, canli db: ${dbUrunler.length})...\n`);

const bekle = ms => new Promise(r => setTimeout(r, ms));
const kontrolEt = link => {
  try {
    return execFileSync('curl', ['-sS', '-o', devNull, '-w', '%{http_code}', '-L',
      '--max-time', '25', '-A', UA, link], { encoding: 'utf8' }).trim();
  } catch (e) { return 'HATA'; }
};

let kotu = 0;
for (const u of urunler) {
  let kod = kontrolEt(u.link);
  /* 429 kirik link degil, hedef sitenin hiz siniri — cogu urun tek bir
     magazadan (Ulugames) geldigi icin art arda istekler bunu tetikliyor.
     Biraz bekleyip bir kez daha deniyoruz; gercek 404/kapanmis urunler
     429 vermez, bu yeniden deneme onlari maskelemez. */
  if (kod === '429') { await bekle(3000); kod = kontrolEt(u.link); }
  const iyi = kod === '200';
  if (!iyi) kotu++;
  console.log(`  ${iyi ? 'ok  ' : 'KOTU'} ${kod.padEnd(5)} ${u.kat.padEnd(12)} ${u.ad.slice(0, 45).padEnd(46)} [${u.kaynak}]`);
  await bekle(400);
}
console.log(`\n─ ${urunler.length} link, ${kotu} sorunlu ─`);
