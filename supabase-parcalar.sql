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
('gpu:7600', 'gpu', 'Radeon RX 7600 8 GB (Sapphire Pulse)', 'AMD', 16629, 48, 8, 165, null, null, null, null, null, null, null, null, null, 20),
('gpu:5060', 'gpu', 'GeForce RTX 5060 8 GB (Zotac Twin Edge)', 'NVIDIA', 18382, 67, 8, 145, null, null, null, null, null, null, null, null, null, 30),
('gpu:9060xt', 'gpu', 'Radeon RX 9060 XT 16 GB (PowerColor Reaper)', 'AMD', 24873, 71, 16, 180, null, null, null, null, null, null, null, null, null, 40),
('gpu:5060ti', 'gpu', 'GeForce RTX 5060 Ti 16 GB (MSI Shadow 2X OC)', 'NVIDIA', 32058, 74, 16, 180, null, null, null, null, null, null, null, null, null, 50),
('gpu:9070', 'gpu', 'Radeon RX 9070 16 GB (Gigabyte Gaming OC)', 'AMD', 36809, 109, 16, 220, null, null, null, null, null, null, null, null, null, 60),
('gpu:5070', 'gpu', 'GeForce RTX 5070 12 GB (Inno3D Twin X2 OC)', 'NVIDIA', 37239, 100, 12, 250, null, null, null, null, null, null, null, null, null, 70),
('gpu:9070xt', 'gpu', 'Radeon RX 9070 XT 16 GB (Gigabyte Gaming OC)', 'AMD', 39749, 117, 16, 304, null, null, null, null, null, null, null, null, null, 80),
('gpu:5070ti', 'gpu', 'GeForce RTX 5070 Ti 16 GB (Palit GamingPro)', 'NVIDIA', 61080, 121, 16, 300, null, null, null, null, null, null, null, null, null, 90),
('gpu:5080', 'gpu', 'GeForce RTX 5080 16 GB (Inno3D X3)', 'NVIDIA', 75999, 131, 16, 360, null, null, null, null, null, null, null, null, null, 100),
('gpu:5090', 'gpu', 'GeForce RTX 5090 32 GB (MSI Ventus 3X OC)', 'NVIDIA', 241999, 168, 32, 575, null, null, null, null, null, null, null, null, null, 110),
('cpu:8500g', 'cpu', 'Ryzen 5 8500G', null, 7299, null, null, 65, 'AM5', 75, 64, true, null, null, null, null, null, 120),
('cpu:7500f', 'cpu', 'Ryzen 5 7500F', null, 6699, null, null, 65, 'AM5', 93, 77, false, null, null, null, null, null, 130),
('cpu:7600', 'cpu', 'Ryzen 5 7600', null, 7169, null, null, 65, 'AM5', 95, 78, true, null, null, null, null, null, 140),
('cpu:245k', 'cpu', 'Core Ultra 5 245K', null, 10799, null, null, 125, 'LGA1851', 96, 101, true, null, null, null, null, null, 150),
('cpu:9600x', 'cpu', 'Ryzen 5 9600X', null, 9481, null, null, 65, 'AM5', 101, 87, true, null, null, null, null, null, 160),
('cpu:265k', 'cpu', 'Core Ultra 7 265K', null, 16981, null, null, 125, 'LGA1851', 100, 120, true, null, null, null, null, null, 170),
('cpu:9700x', 'cpu', 'Ryzen 7 9700X', null, 12399, null, null, 65, 'AM5', 104, 98, true, null, null, null, null, null, 180),
('cpu:285k', 'cpu', 'Core Ultra 9 285K', null, 29119, null, null, 125, 'LGA1851', 104, 130, true, null, null, null, null, null, 190),
('cpu:7800x3d', 'cpu', 'Ryzen 7 7800X3D', null, 15080, null, null, 120, 'AM5', 112, 89, true, null, null, null, null, null, 200),
('cpu:9950x3d', 'cpu', 'Ryzen 9 9950X3D', null, 33518, null, null, 170, 'AM5', 118, 139, true, null, null, null, null, null, 210),
('cpu:9800x3d', 'cpu', 'Ryzen 7 9800X3D', null, 21440, null, null, 120, 'AM5', 125, 108, true, null, null, null, null, null, 220),
('ram:16', 'ram', '16 GB DDR5-6000 (XPG Lancer Blade)', null, 11999, null, null, null, null, null, null, null, null, 16, null, null, null, 230),
('ram:32', 'ram', '32 GB DDR5-6000 CL30 (2×16) (Patriot Viper Xtreme 5)', null, 25599, null, null, null, null, null, null, null, null, 32, null, null, null, 240),
('ram:64', 'ram', '64 GB DDR5-6000 (2×32) (G.Skill Ripjaws S5)', null, 52849, null, null, null, null, null, null, null, null, 64, null, null, null, 250),
('ssd:500', 'ssd', '500 GB NVMe Gen4 (WD Blue SN5100)', null, 4549, null, null, null, null, null, null, null, null, 500, null, null, null, 260),
('ssd:1t', 'ssd', '1 TB NVMe Gen4 (WD Blue SN5100)', null, 7438, null, null, null, null, null, null, null, null, 1000, null, null, null, 270),
('ssd:2t', 'ssd', '2 TB NVMe Gen4 (WD Blue SN5100)', null, 15639, null, null, null, null, null, null, null, null, 2000, null, null, null, 280),
('psu:550', 'psu', '550 W 80+ (MSI MAG A550BNL)', null, 2068, null, null, null, null, null, null, null, 550, null, null, null, null, 290),
('psu:650', 'psu', '650 W 80+ (MSI MAG A650BNL)', null, 2629, null, null, null, null, null, null, null, 650, null, null, null, null, 300),
('psu:750', 'psu', '750 W 80+ (MSI MAG A750BN)', null, 3539, null, null, null, null, null, null, null, 750, null, null, null, null, 310),
('psu:850', 'psu', '850 W 80+ Gold (MSI MAG A850GN)', null, 5829, null, null, null, null, null, null, null, 850, null, null, null, null, 320),
('psu:1000', 'psu', '1000 W 80+ Gold (MSI MAG A1000GL)', null, 8259, null, null, null, null, null, null, null, 1000, null, null, null, null, 330),
('psu:1200', 'psu', '1200 W 80+ Gold (NZXT C1200)', null, 9190, null, null, null, null, null, null, null, 1200, null, null, null, null, 340),
('sogutucu:stock', 'sogutucu', 'Kutudan çıkan soğutucu', null, 0, null, null, null, null, null, null, null, null, null, 65, null, null, 350),
('sogutucu:air', 'sogutucu', 'Kule tipi hava soğutucu (Thermalright Assassin X 120 Refined SE)', null, 1185, null, null, null, null, null, null, null, null, null, 180, null, null, 360),
('sogutucu:aio360', 'sogutucu', '360 mm sıvı soğutma (Thermalright Frozen Magic 360 ARGB)', null, 3409, null, null, null, null, null, null, null, null, null, 280, null, null, 370),
('sogutucu:aio360p', 'sogutucu', '360 mm sıvı soğutma (MSI MAG CoreLiquid A13 360)', null, 4578, null, null, null, null, null, null, null, null, null, 300, null, null, 380),
('anakart:AM5-0', 'anakart', 'MSI Pro A620AM-G Evo WiFi (A620)', null, 4849, null, null, null, 'AM5', null, null, null, null, null, null, 1, null, 390),
('anakart:AM5-1', 'anakart', 'MSI B650M Gaming WiFi (B650)', null, 7631, null, null, null, 'AM5', null, null, null, null, null, null, 2, null, 400),
('anakart:AM5-2', 'anakart', 'Asus B650E Max Gaming WiFi W (B650E)', null, 10693, null, null, null, 'AM5', null, null, null, null, null, null, 3, null, 410),
('anakart:LGA1851-0', 'anakart', 'MSI Pro B860M-E (B860)', null, 5660, null, null, null, 'LGA1851', null, null, null, null, null, null, 2, null, 420),
('anakart:LGA1851-1', 'anakart', 'MSI Pro Z890-S WiFi6E (Z890)', null, 9799, null, null, null, 'LGA1851', null, null, null, null, null, null, 3, null, 430),
('kasa:0', 'kasa', 'Hava akışlı standart kasa (MSI MAG Forge M100A)', null, 2231, null, null, null, null, null, null, null, null, null, null, null, 35000, 440),
('kasa:1', 'kasa', 'Mesh ön panelli kasa (NZXT H3 Flow)', null, 3256, null, null, null, null, null, null, null, null, null, null, null, 70000, 450),
('kasa:2', 'kasa', 'Camlı, yüksek hava akışlı kasa (Corsair Frame 4000D RS ARGB)', null, 6270, null, null, null, null, null, null, null, null, null, null, null, null, 460);

notify pgrst, 'reload schema';
