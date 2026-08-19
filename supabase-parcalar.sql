-- SETUP HANE - parca tablosu (/panel > PARCALAR bunu yonetir)
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
('gpu:igpu', 'gpu', 'Dahili grafik (ayrı kart yok)', '—', 0, 12, 0, 0, null, null, null, null, null, null, null, null, null, 10),
('gpu:6600', 'gpu', 'Radeon RX 6600 8 GB (Asus Dual)', 'AMD', 13949, 40, 8, 132, null, null, null, null, null, null, null, null, null, 20),
('gpu:b580', 'gpu', 'Intel Arc B580 12 GB (Sparkle Titan OC)', 'Intel', 12725, 55, 12, 190, null, null, null, null, null, null, null, null, null, 30),
('gpu:7600', 'gpu', 'Radeon RX 7600 8 GB (Asus Dual Evo OC)', 'AMD', 10800, 48, 8, 165, null, null, null, null, null, null, null, null, null, 40),
('gpu:4060', 'gpu', 'GeForce RTX 4060 8 GB (Asus Dual OC)', 'NVIDIA', 16648, 54, 8, 115, null, null, null, null, null, null, null, null, null, 50),
('gpu:5060', 'gpu', 'GeForce RTX 5060 8 GB (Asus Dual OC)', 'NVIDIA', 16969, 58, 8, 145, null, null, null, null, null, null, null, null, null, 60),
('gpu:9060xt', 'gpu', 'Radeon RX 9060 XT 16 GB (Gigabyte Gaming OC)', 'AMD', 18599, 64, 16, 180, null, null, null, null, null, null, null, null, null, 70),
('gpu:5060ti', 'gpu', 'GeForce RTX 5060 Ti 16 GB (Asus Dual OC)', 'NVIDIA', 33200, 74, 16, 180, null, null, null, null, null, null, null, null, null, 80),
('gpu:9070', 'gpu', 'Radeon RX 9070 16 GB', 'AMD', 42902, 92, 16, 220, null, null, null, null, null, null, null, null, null, 90),
('gpu:5070', 'gpu', 'GeForce RTX 5070 12 GB (MSI Ventus 2X OC)', 'NVIDIA', 36599, 100, 12, 250, null, null, null, null, null, null, null, null, null, 100),
('gpu:9070xt', 'gpu', 'Radeon RX 9070 XT 16 GB (XFX Swift Gaming OC)', 'AMD', 34493, 112, 16, 304, null, null, null, null, null, null, null, null, null, 110),
('gpu:5070ti', 'gpu', 'GeForce RTX 5070 Ti 16 GB (Asus Prime OC)', 'NVIDIA', 62399, 126, 16, 300, null, null, null, null, null, null, null, null, null, 120),
('gpu:5080', 'gpu', 'GeForce RTX 5080 16 GB (PNY OC)', 'NVIDIA', 59999, 152, 16, 360, null, null, null, null, null, null, null, null, null, 130),
('gpu:5090', 'gpu', 'GeForce RTX 5090 32 GB (Asus TUF Gaming)', 'NVIDIA', 245336, 205, 32, 575, null, null, null, null, null, null, null, null, null, 140),
('cpu:7400f', 'cpu', 'Ryzen 5 7400F', null, 5546, null, null, 65, 'AM5', 68, 62, false, null, null, null, null, null, 150),
('cpu:8500g', 'cpu', 'Ryzen 5 8500G', null, 7383, null, null, 65, 'AM5', 55, 52, true, null, null, null, null, null, 160),
('cpu:7500f', 'cpu', 'Ryzen 5 7500F', null, 6999, null, null, 65, 'AM5', 74, 68, false, null, null, null, null, null, 170),
('cpu:7600', 'cpu', 'Ryzen 5 7600', null, 7253, null, null, 65, 'AM5', 78, 71, true, null, null, null, null, null, 180),
('cpu:245k', 'cpu', 'Core Ultra 5 245K', null, 10400, null, null, 125, 'LGA1851', 88, 96, true, null, null, null, null, null, 190),
('cpu:9600x', 'cpu', 'Ryzen 5 9600X', null, 9475, null, null, 65, 'AM5', 92, 80, true, null, null, null, null, null, 200),
('cpu:9700x', 'cpu', 'Ryzen 7 9700X', null, 12300, null, null, 65, 'AM5', 94, 104, true, null, null, null, null, null, 210),
('cpu:265k', 'cpu', 'Core Ultra 7 265K', null, 16900, null, null, 125, 'LGA1851', 95, 124, true, null, null, null, null, null, 220),
('cpu:7800x3d', 'cpu', 'Ryzen 7 7800X3D', null, 14697, null, null, 120, 'AM5', 108, 88, true, null, null, null, null, null, 230),
('cpu:9800x3d', 'cpu', 'Ryzen 7 9800X3D', null, 21808, null, null, 120, 'AM5', 125, 108, true, null, null, null, null, null, 240),
('cpu:285k', 'cpu', 'Core Ultra 9 285K', null, 27094, null, null, 125, 'LGA1851', 96, 150, true, null, null, null, null, null, 250),
('cpu:9950x3d', 'cpu', 'Ryzen 9 9950X3D', null, 33564, null, null, 170, 'AM5', 128, 165, true, null, null, null, null, null, 260),
('ram:16', 'ram', '16 GB DDR5-6000 (2×8) (Kingston Fury Beast)', null, 12999, null, null, null, null, null, null, null, null, 16, null, null, null, 270),
('ram:32', 'ram', '32 GB DDR5-6000 CL30 (2×16) (G.Skill Trident Z5 RGB)', null, 22199, null, null, null, null, null, null, null, null, 32, null, null, null, 280),
('ram:64', 'ram', '64 GB DDR5-6000 (2×32) (Kingston Fury Beast)', null, 51206, null, null, null, null, null, null, null, null, 64, null, null, null, 290),
('ssd:500', 'ssd', '500 GB NVMe Gen4 (SanDisk Extreme)', null, 3143, null, null, null, null, null, null, null, null, 500, null, null, null, 300),
('ssd:1t', 'ssd', '1 TB NVMe Gen4 (Kingston KC3000)', null, 3275, null, null, null, null, null, null, null, null, 1000, null, null, null, 310),
('ssd:2t', 'ssd', '2 TB NVMe Gen4 (Kingston NV2)', null, 12141, null, null, null, null, null, null, null, null, 2000, null, null, null, 320),
('psu:550', 'psu', '550 W 80+ Bronze (Strong ST550)', null, 1059, null, null, null, null, null, null, null, 550, null, null, null, null, 330),
('psu:650', 'psu', '650 W 80+ Bronze (Rampage RMP-650-80PB)', null, 2308, null, null, null, null, null, null, null, 650, null, null, null, null, 340),
('psu:750', 'psu', '750 W 80+ Gold (MSI MAG A750GL)', null, 5299, null, null, null, null, null, null, null, 750, null, null, null, null, 350),
('psu:850', 'psu', '850 W 80+ Gold (Rampage P850)', null, 4000, null, null, null, null, null, null, null, 850, null, null, null, null, 360),
('psu:1000', 'psu', '1000 W 80+ Gold (MSI MPG A1000GS)', null, 10259, null, null, null, null, null, null, null, 1000, null, null, null, null, 370),
('psu:1200', 'psu', '1200 W 80+ Platinum', null, 17300, null, null, null, null, null, null, null, 1200, null, null, null, null, 380),
('sogutucu:stock', 'sogutucu', 'Kutudan çıkan soğutucu', null, 0, null, null, null, null, null, null, null, null, null, 65, null, null, 390),
('sogutucu:air', 'sogutucu', 'Kule tipi hava soğutucu (Segotep Wind Clear T2)', null, 1889, null, null, null, null, null, null, null, null, null, 105, null, null, 400),
('sogutucu:tower', 'sogutucu', 'Çift fanlı büyük kule', null, 2600, null, null, null, null, null, null, null, null, null, 180, null, null, 410),
('sogutucu:aio', 'sogutucu', '240 mm sıvı soğutma (DeepCool LE520 ARGB)', null, 2290, null, null, null, null, null, null, null, null, null, 260, null, null, 420),
('anakart:AM5-0', 'anakart', 'Gigabyte A620M H (A620)', null, 3689, null, null, null, 'AM5', null, null, null, null, null, null, 1, null, 430),
('anakart:AM5-1', 'anakart', 'Biostar B650MP-E Pro (B650)', null, 4069, null, null, null, 'AM5', null, null, null, null, null, null, 2, null, 440),
('anakart:AM5-2', 'anakart', 'Asus B650E Max Gaming Wi-Fi (B650E)', null, 9799, null, null, null, 'AM5', null, null, null, null, null, null, 3, null, 450),
('anakart:LGA1851-0', 'anakart', 'Gigabyte B860 DS3H WIFI6E (B860)', null, 7006, null, null, null, 'LGA1851', null, null, null, null, null, null, 2, null, 460),
('anakart:LGA1851-1', 'anakart', 'Asus TUF Gaming Z890-PLUS Wi-Fi (Z890)', null, 14432, null, null, null, 'LGA1851', null, null, null, null, null, null, 3, null, 470),
('kasa:0', 'kasa', 'Hava akışlı standart kasa (MSI)', null, 2169, null, null, null, null, null, null, null, null, null, null, null, 35000, 480),
('kasa:1', 'kasa', 'Mesh ön panelli kasa (MSI Mag Forge 320R Airflow)', null, 3219, null, null, null, null, null, null, null, null, null, null, null, 70000, 490),
('kasa:2', 'kasa', 'Camlı, yüksek hava akışlı kasa (Corsair Frame 4000D)', null, 5041, null, null, null, null, null, null, null, null, null, null, null, null, 500);

notify pgrst, 'reload schema';
