/* Ekran karti UZUNLUGU (Epey "Derinlik" alani):  node scripts/epey-boy.mjs
   Neden: "kart kasaya sigar mi" SERT KURALI, kartta boy verisi yoksa sessizce
   uygulanmiyor. Olcum olmadan kural yok demektir; bu arac olcumu kaynagindan
   getirir. Uydurma boy yazmak, hic yazmamaktan kotudur.
   Cikti: her katalog karti icin  id | boy(mm) | Epey urun adi | link        */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const cek = u => execFileSync('curl', ['-sS', '--compressed', '-A', UA,
  '-H', 'accept-language: tr-TR,tr;q=0.9', '--max-time', '30', u], { encoding: 'utf8', maxBuffer: 3e7 });
const bekle = ms => new Promise(r => setTimeout(r, ms));

/* Ters bolu kullanmadan kuruluyor: kabuk heredoc icinde bozuluyor (CLAUDE.md). */
const LISTE_RE = () => new RegExp('href="([^"]+)" class="urunadi" title="([^"]+)"', 'g');
/* 's' bayragi sart: Derinlik ile olcu arasinda satir sonlari ve
   'cs1' gibi RAKAM iceren sinif adlari var; [^0-9] orada kopuyordu. */
const BOY_RE   = new RegExp('Derinlik.{0,400}?([0-9]{2,4}) ?mm', 's');

const sadelestir = t => t.toLowerCase()
  .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
  .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[ ]+/g,' ');

// 1) Liste sayfalarindan ad + link topla
const ilanlar = [];
for (let s = 1; s <= 16; s++) {
  const u = s === 1 ? 'https://www.epey.com/ekran-karti/' : `https://www.epey.com/ekran-karti/${s}/`;
  let h; try { h = cek(u); } catch { break; }
  if (h.length < 5000) break;
  let m; const re = LISTE_RE();
  while ((m = re.exec(h))) ilanlar.push({ link: m[1], ad: m[2].replace(/ Ekran Kartı$/i, '').trim() });
  await bekle(500);
}
console.error(`${ilanlar.length} ilan toplandi`);

// 2) Katalogdaki kartlar
const src = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const i = src.indexOf('const GPUS=['), j = src.indexOf('\n];', i);
const GPUS = new Function('return ' + src.slice(i + 'const GPUS='.length, j + 2))();

for (const g of GPUS) {
  if (g.id === 'igpu') continue;
  /* Parantezdeki gercek model adi eslestirmenin anahtari; genel ad (RTX 5080)
     onlarca modele uyuyor, parantez icindeki tek bir urune. */
  const par = (g.n.match(/[(]([^)]+)[)]/) || [])[1] || '';
  const jeton = sadelestir(par).split(' ').filter(w => w.length > 2);
  const cip = sadelestir(g.n.split('(')[0]).replace(/ [0-9]+ gb/, '').trim();
  /* Ust model kendi alt modelini yutuyor: 'rtx 5070' dizesi
     'RTX 5070 Ti' ilaninda da var. Bizim adimizda yoksa dislaniyor. */
  const dis = [];
  if (!cip.includes(' ti')) dis.push(' ti ');
  if (!cip.includes(' xt')) dis.push(' xt ');
  const aday = ilanlar.filter(x => {
    const a = sadelestir(x.ad);
    if (dis.some(k => (a + ' ').includes(k))) return false;
    return cip.split(' ').every(w => a.includes(w)) && jeton.every(w => a.includes(w));
  });
  /* Varyant tuzagi: 'Eagle OC' jetonlari 'Eagle Max OC' ilanina da uyuyor
     ve YANLIS olcu geliyor (208 yerine 281 mm). Fazladan kelimesi en az olan
     ilan bizim modelimizdir; birden fazla aday kalirsa uyari basiliyor. */
  aday.sort((x, y) => sadelestir(x.ad).split(' ').length - sadelestir(y.ad).split(' ').length);
  if (aday.length > 1) console.error("  ! " + g.id + ": " + aday.length + " aday, en sade secildi -> " + aday[0].ad);
  if (!aday.length) { console.log(`${g.id.padEnd(8)} | ESLESME YOK  | ${par}`); continue; }
  let boy = null, kaynak = aday[0];
  for (const a of aday.slice(0, 3)) {
    let h; try { h = cek(a.link); } catch { continue; }
    const m = h.match(BOY_RE);
    if (m) { boy = +m[1]; kaynak = a; break; }
    await bekle(400);
  }
  console.log(`${g.id.padEnd(8)} | ${boy ? String(boy).padStart(3) + ' mm' : 'OLCU YOK'} | ${kaynak.ad}`);
  await bekle(400);
}
