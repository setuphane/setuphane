// src/setuphane.html icindeki laptop ve parca verisini okuyup Supabase seed
// SQL'i uretir:  node scripts/veri-sql.mjs > supabase-laptop-parca.sql
// Amac: kodda duran veriyi elle SQL'e cevirmek yerine tek kaynaktan uretmek.
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const q = v => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";

// Kendi dosyamizdaki duz nesne dizileri; disaridan veri gelmiyor.
function dizi(ad) {
  const i = s.indexOf('const ' + ad + '=[');
  if (i < 0) throw new Error(ad + ' bulunamadi');
  const j = s.indexOf('\n];', i);
  const govde = s.slice(i + ('const ' + ad + '=').length, j + 2);
  return new Function('Infinity', 'return ' + govde)(Number.POSITIVE_INFINITY);
}
function nesne(ad) {
  const i = s.indexOf('const ' + ad + '={');
  const j = s.indexOf('\n};', i);
  return new Function('return ' + s.slice(i + ('const ' + ad + '=').length, j + 2))();
}

const parcalar = [];
const ekle = (kat, anahtar, adi, fiyat) =>
  parcalar.push({ anahtar: kat + ':' + anahtar, kat, ad: adi, fiyat: Math.round(fiyat) });

for (const g of dizi('GPUS'))    ekle('gpu',  g.id, g.n, g.p);
for (const c of dizi('CPUS'))    ekle('cpu',  c.id, c.n, c.p);
for (const r of dizi('RAMS'))    ekle('ram',  r.id, r.n, r.p);
for (const d of dizi('SSDS'))    ekle('ssd',  d.id, d.n, d.p);
for (const p of dizi('PSUS'))    ekle('psu',  p.id, p.n, p.p);
for (const k of dizi('COOLERS')) ekle('sogutucu', k.id, k.n, k.p);
// BOARDS/CASES'te id yok; sirayla sabit anahtar uretiyoruz.
const B = nesne('BOARDS');
for (const plat of Object.keys(B)) B[plat].forEach((b, i) => ekle('anakart', plat + '-' + i, b.n, b.p));
dizi('CASES').forEach((c, i) => ekle('kasa', String(i), c.n, c.p));

const laptoplar = dizi('LAPTOPS');

const satirP = parcalar.map(p =>
  `(${q(p.anahtar)}, ${q(p.kat)}, ${q(p.ad)}, ${p.fiyat})`).join(',\n');
const satirL = laptoplar.map((l, i) =>
  `(${q(l.name)}, ${q(l.brand)}, ${l.price}, ${q(l.image)}, ${q(l.url)}, ${q(l.gpu)}, ${q(l.cpu)}, ` +
  `${l.ram ?? 'null'}, ${l.ssd ?? 'null'}, ${q(l.inch)}, ${l.offers ?? 0}, ${i * 10})`).join(',\n');

process.stdout.write(`-- SETUP HANE — laptop listesi + parca fiyat override tablosu
-- Uretildi: node scripts/veri-sql.mjs  (kaynak: src/setuphane.html)
-- Supabase > SQL Editor > yapistir > Run.
-- DIKKAT: bastan kurar. Panelden girilmis veri varsa once yedek al.

drop table if exists laptoplar cascade;
drop table if exists parca_fiyat cascade;

-- ── Laptoplar ────────────────────────────────────────────────────────────
-- Tam kayit panelden yonetiliyor. idx (guc puani) BILEREK yok: kodda
-- GPU_IDX tablosundan turetiliyor, boylece panelden yanlis bir guc degeri
-- girilip FPS tahminleri sessizce bozulamiyor.
create table laptoplar (
  id uuid primary key default gen_random_uuid(),
  ad     text not null check (char_length(ad) between 5 and 200),
  marka  text not null check (char_length(marka) between 2 and 40),
  fiyat  int  not null check (fiyat > 0),
  gorsel text not null check (gorsel ~ '^https://'),
  link   text not null check (link ~ '^https://'),
  gpu    text not null,
  cpu    text,
  ram    int,
  ssd    int,
  inch   text,
  saticilar int not null default 0,
  sira   int not null default 0,
  aktif  boolean not null default true,
  guncelleme timestamptz not null default now()
);
create index laptoplar_fiyat_idx on laptoplar (fiyat);

-- ── Parca fiyat override ────────────────────────────────────────────────
-- Yalnizca FIYAT. Guc/soket/watt gibi algoritma girdileri kodda kalir;
-- boyle bir alan panelden degistirilebilseydi, hatali tek bir deger
-- uyumsuz anakart ya da yetersiz guc kaynagi onerilmesine yol acabilirdi.
-- Site: override varsa onu, yoksa koddaki fiyati kullanir.
create table parca_fiyat (
  anahtar text primary key,
  kat     text not null,
  ad      text not null,
  fiyat   int  not null check (fiyat >= 0),
  guncelleme timestamptz not null default now()
);

alter table laptoplar   enable row level security;
alter table parca_fiyat enable row level security;

create policy oku_l on laptoplar   for select using (true);
create policy oku_p on parca_fiyat for select using (true);

-- Yazma yalnizca yoneticiye. "to authenticated" tek basina YETMEZ.
create policy ekle_l   on laptoplar for insert to authenticated with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy guncel_l on laptoplar for update to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com') with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_l    on laptoplar for delete to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy ekle_p   on parca_fiyat for insert to authenticated with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy guncel_p on parca_fiyat for update to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com') with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_p    on parca_fiyat for delete to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');

insert into parca_fiyat (anahtar, kat, ad, fiyat) values
${satirP};

-- Laptop satirlari BILEREK burada degil: 49 kayit bu betigi gereksiz
-- sisiriyordu. Tablo bos oldugunda /panel > LAPTOPLAR sekmesinde
-- "KODDAKI LISTEYI ICERI AKTAR" dugmesi cikiyor; kodda duran liste tek
-- tikla buraya yaziliyor. Ayni dugme ileride listeyi yenilemek icin de
-- kullanilabilir.

notify pgrst, 'reload schema';
`);
