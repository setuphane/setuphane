// src/setuphane.html icindeki parca verisini okuyup Supabase seed SQL'i uretir:
//   node scripts/veri-sql.mjs > supabase-parcalar.sql
// Amac: kodda duran veriyi elle SQL'e cevirmek yerine tek kaynaktan uretmek.
import { readFileSync } from 'node:fs';

const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
const q = v => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const n = v => (v == null || !isFinite(v)) ? 'null' : String(Math.round(v));
const b = v => v == null ? 'null' : (v ? 'true' : 'false');

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

const satirlar = [];
let sira = 0;
const ekle = o => satirlar.push({ sira: (sira += 10), ...o });

dizi('GPUS').forEach(g => ekle({ anahtar:'gpu:'+g.id, kat:'gpu', ad:g.n, marka:g.b,
  fiyat:g.p, idx:g.idx, vram:g.vram, tdp:g.tdp }));
dizi('CPUS').forEach(c => ekle({ anahtar:'cpu:'+c.id, kat:'cpu', ad:c.n,
  fiyat:c.p, plat:c.plat, oyun:c.g, cokluIs:c.m, tdp:c.tdp, dahiliGrafik:c.ig }));
dizi('RAMS').forEach(r => ekle({ anahtar:'ram:'+r.id, kat:'ram', ad:r.n, fiyat:r.p, kapasite:r.gb }));
dizi('SSDS').forEach(d => ekle({ anahtar:'ssd:'+d.id, kat:'ssd', ad:d.n, fiyat:d.p, kapasite:d.gb }));
dizi('PSUS').forEach(p => ekle({ anahtar:'psu:'+p.id, kat:'psu', ad:p.n, fiyat:p.p, watt:p.w }));
dizi('COOLERS').forEach(k => ekle({ anahtar:'sogutucu:'+k.id, kat:'sogutucu', ad:k.n,
  fiyat:k.p, sogutmaKap:k.cap }));
const B = nesne('BOARDS');
Object.keys(B).forEach(plat => B[plat].forEach((x,i) =>
  ekle({ anahtar:'anakart:'+plat+'-'+i, kat:'anakart', ad:x.n, fiyat:x.p, plat, kademe:x.t })));
dizi('CASES').forEach((c,i) => ekle({ anahtar:'kasa:'+i, kat:'kasa', ad:c.n, fiyat:c.p,
  butceUst: isFinite(c.upTo) ? c.upTo : null }));

const satir = o => `(${q(o.anahtar)}, ${q(o.kat)}, ${q(o.ad)}, ${q(o.marka)}, ${n(o.fiyat)}, ` +
  `${n(o.idx)}, ${n(o.vram)}, ${n(o.tdp)}, ${q(o.plat)}, ${n(o.oyun)}, ${n(o.cokluIs)}, ` +
  `${b(o.dahiliGrafik)}, ${n(o.watt)}, ${n(o.kapasite)}, ${n(o.sogutmaKap)}, ${n(o.kademe)}, ` +
  `${n(o.butceUst)}, ${o.sira})`;

process.stdout.write(`-- SETUP HANE - parca tablosu (/panel > PARCALAR bunu yonetir)
-- Uretildi: node scripts/veri-sql.mjs  (kaynak: src/setuphane.html)
-- Supabase > SQL Editor > yapistir > Run.  DIKKAT: bastan kurar.

drop table if exists parca_fiyat cascade;   -- yerini bu tablo aldi
drop table if exists parcalar cascade;

-- Tek tablo, kat sutunu ayirici. Yapisal alanlar kategoriye gore dolu:
--   gpu      -> idx, vram, tdp
--   cpu      -> plat, oyun, coklu_is, tdp, dahili_grafik
--   ram/ssd  -> kapasite      psu -> watt        sogutucu -> sogutma_kap
--   anakart  -> plat, kademe  kasa -> butce_ust (null = sinirsiz)
-- CHECK'ler panelden sacma deger girilmesini engelliyor: bu alanlar sistem
-- kurma algoritmasini besliyor, hatali biri uyumsuz parca onerilmesine
-- yol acabilir.
create table parcalar (
  id uuid primary key default gen_random_uuid(),
  anahtar text unique not null,
  kat  text not null check (kat in ('gpu','cpu','ram','ssd','psu','sogutucu','anakart','kasa')),
  ad   text not null check (char_length(ad) between 2 and 120),
  marka text,
  fiyat int not null check (fiyat >= 0 and fiyat < 2000000),
  idx   int check (idx between 0 and 400),
  vram  int check (vram between 0 and 64),
  tdp   int check (tdp between 0 and 1000),
  plat  text check (plat is null or plat in ('AM5','LGA1851')),
  oyun     int check (oyun between 0 and 400),
  coklu_is int check (coklu_is between 0 and 400),
  dahili_grafik boolean,
  watt        int check (watt between 0 and 3000),
  kapasite    int check (kapasite between 0 and 100000),
  sogutma_kap int check (sogutma_kap between 0 and 1000),
  kademe      int check (kademe between 1 and 5),
  butce_ust   int check (butce_ust > 0),
  sira  int not null default 0,
  aktif boolean not null default true,
  guncelleme timestamptz not null default now()
);
create index parcalar_kat_idx on parcalar (kat, sira);

alter table parcalar enable row level security;
create policy oku_pa on parcalar for select using (true);
create policy ekle_pa   on parcalar for insert to authenticated with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy guncel_pa on parcalar for update to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com') with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_pa    on parcalar for delete to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');

insert into parcalar (anahtar, kat, ad, marka, fiyat, idx, vram, tdp, plat, oyun, coklu_is,
                      dahili_grafik, watt, kapasite, sogutma_kap, kademe, butce_ust, sira) values
${satirlar.map(satir).join(',\n')};

notify pgrst, 'reload schema';
`);
