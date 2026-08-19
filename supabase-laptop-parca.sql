-- SETUP HANE — laptop listesi + parca fiyat override tablosu
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
('gpu:igpu', 'gpu', 'Dahili grafik (ayrı kart yok)', 0),
('gpu:6600', 'gpu', 'Radeon RX 6600 8 GB (Asus Dual)', 13949),
('gpu:b580', 'gpu', 'Intel Arc B580 12 GB (Sparkle Titan OC)', 12725),
('gpu:7600', 'gpu', 'Radeon RX 7600 8 GB (Asus Dual Evo OC)', 10800),
('gpu:4060', 'gpu', 'GeForce RTX 4060 8 GB (Asus Dual OC)', 16648),
('gpu:5060', 'gpu', 'GeForce RTX 5060 8 GB (Asus Dual OC)', 16969),
('gpu:9060xt', 'gpu', 'Radeon RX 9060 XT 16 GB (Gigabyte Gaming OC)', 18599),
('gpu:5060ti', 'gpu', 'GeForce RTX 5060 Ti 16 GB (Asus Dual OC)', 33200),
('gpu:9070', 'gpu', 'Radeon RX 9070 16 GB', 42902),
('gpu:5070', 'gpu', 'GeForce RTX 5070 12 GB (MSI Ventus 2X OC)', 36599),
('gpu:9070xt', 'gpu', 'Radeon RX 9070 XT 16 GB (XFX Swift Gaming OC)', 34493),
('gpu:5070ti', 'gpu', 'GeForce RTX 5070 Ti 16 GB (Asus Prime OC)', 62399),
('gpu:5080', 'gpu', 'GeForce RTX 5080 16 GB (PNY OC)', 59999),
('gpu:5090', 'gpu', 'GeForce RTX 5090 32 GB (Asus TUF Gaming)', 245336),
('cpu:7400f', 'cpu', 'Ryzen 5 7400F', 5546),
('cpu:8500g', 'cpu', 'Ryzen 5 8500G', 7383),
('cpu:7500f', 'cpu', 'Ryzen 5 7500F', 6999),
('cpu:7600', 'cpu', 'Ryzen 5 7600', 7253),
('cpu:245k', 'cpu', 'Core Ultra 5 245K', 10400),
('cpu:9600x', 'cpu', 'Ryzen 5 9600X', 9475),
('cpu:9700x', 'cpu', 'Ryzen 7 9700X', 12300),
('cpu:265k', 'cpu', 'Core Ultra 7 265K', 16900),
('cpu:7800x3d', 'cpu', 'Ryzen 7 7800X3D', 14697),
('cpu:9800x3d', 'cpu', 'Ryzen 7 9800X3D', 21808),
('cpu:285k', 'cpu', 'Core Ultra 9 285K', 27094),
('cpu:9950x3d', 'cpu', 'Ryzen 9 9950X3D', 33564),
('ram:16', 'ram', '16 GB DDR5-6000 (2×8) (Kingston Fury Beast)', 12999),
('ram:32', 'ram', '32 GB DDR5-6000 CL30 (2×16) (G.Skill Trident Z5 RGB)', 22199),
('ram:64', 'ram', '64 GB DDR5-6000 (2×32) (Kingston Fury Beast)', 51206),
('ssd:500', 'ssd', '500 GB NVMe Gen4 (SanDisk Extreme)', 3143),
('ssd:1t', 'ssd', '1 TB NVMe Gen4 (Kingston KC3000)', 3275),
('ssd:2t', 'ssd', '2 TB NVMe Gen4 (Kingston NV2)', 12141),
('psu:550', 'psu', '550 W 80+ Bronze (Strong ST550)', 1059),
('psu:650', 'psu', '650 W 80+ Bronze (Rampage RMP-650-80PB)', 2308),
('psu:750', 'psu', '750 W 80+ Gold (MSI MAG A750GL)', 5299),
('psu:850', 'psu', '850 W 80+ Gold (Rampage P850)', 4000),
('psu:1000', 'psu', '1000 W 80+ Gold (MSI MPG A1000GS)', 10259),
('psu:1200', 'psu', '1200 W 80+ Platinum', 17300),
('sogutucu:stock', 'sogutucu', 'Kutudan çıkan soğutucu', 0),
('sogutucu:air', 'sogutucu', 'Kule tipi hava soğutucu (Segotep Wind Clear T2)', 1889),
('sogutucu:tower', 'sogutucu', 'Çift fanlı büyük kule', 2600),
('sogutucu:aio', 'sogutucu', '240 mm sıvı soğutma (DeepCool LE520 ARGB)', 2290),
('anakart:AM5-0', 'anakart', 'Gigabyte A620M H (A620)', 3689),
('anakart:AM5-1', 'anakart', 'Biostar B650MP-E Pro (B650)', 4069),
('anakart:AM5-2', 'anakart', 'Asus B650E Max Gaming Wi-Fi (B650E)', 9799),
('anakart:LGA1851-0', 'anakart', 'Gigabyte B860 DS3H WIFI6E (B860)', 7006),
('anakart:LGA1851-1', 'anakart', 'Asus TUF Gaming Z890-PLUS Wi-Fi (Z890)', 14432),
('kasa:0', 'kasa', 'Hava akışlı standart kasa (MSI)', 2169),
('kasa:1', 'kasa', 'Mesh ön panelli kasa (MSI Mag Forge 320R Airflow)', 3219),
('kasa:2', 'kasa', 'Camlı, yüksek hava akışlı kasa (Corsair Frame 4000D)', 5041);

-- Laptop satirlari BILEREK burada degil: 49 kayit bu betigi gereksiz
-- sisiriyordu. Tablo bos oldugunda /panel > LAPTOPLAR sekmesinde
-- "KODDAKI LISTEYI ICERI AKTAR" dugmesi cikiyor; kodda duran liste tek
-- tikla buraya yaziliyor. Ayni dugme ileride listeyi yenilemek icin de
-- kullanilabilir.

notify pgrst, 'reload schema';
