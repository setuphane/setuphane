-- SETUP HANE — aksesuar urun tablosu (/panel bunu yonetir)
-- Supabase panelinde: SQL Editor -> New query -> yapistir -> Run.
--
-- Bu betik tabloyu BASTAN KURAR. Icinde panelden girilmis urun varsa
-- ONCE YEDEK AL (Table Editor -> urunler -> Export).
--
-- Kurulumdan sonra yapilacak TEK sey: Authentication -> Users -> Add user
-- ile kendine bir e-posta/sifre olustur. /panel o hesapla giris istiyor.
-- Kayit ekrani yok; kullanici yalnizca Supabase panelinden eklenir.

drop table if exists urunler cascade;

create table urunler (
  id uuid primary key default gen_random_uuid(),
  -- kat: koddaki AKSESUAR_KATEGORILERI ile birebir ayni olmali; yanlis
  -- yazilan kategori sitede hicbir yerde gorunmez, bu yuzden CHECK ile bagli.
  kat text not null check (kat in (
    'mousepad','kablo','bilek','tustakimi','mouseaksesuar',
    'rgb','sesgoruntu','standlar','kontrolcu','dekor')),
  ad     text not null check (char_length(ad) between 2 and 120),
  kaynak text not null check (char_length(kaynak) between 2 and 40),
  -- https zorunlu: site https, karisik icerik tarayicida engellenir.
  gorsel text not null check (gorsel ~ '^https://'),
  link   text not null check (link ~ '^https://'),
  -- /oner sayfasinin eslestirme yaptigi kelimeler.
  anahtar text[] not null default '{}',
  sira    int not null default 0,
  -- aktif=false: urun sitede gorunmez ama panelde durur (stok bitti vb.)
  aktif   boolean not null default true,
  olusturma timestamptz not null default now()
);

create index urunler_kat_sira_idx on urunler (kat, sira);

alter table urunler enable row level security;

-- Herkes okur: /aksesuarlar ve /oner anon anahtarla listeliyor.
create policy oku_u on urunler for select using (true);

-- Yazma yalnizca YONETICIYE. Dikkat: "to authenticated" tek basina YETMEZ —
-- projede kayit acik oldugu icin herhangi biri hesap acip authenticated
-- olabiliyor ve o hakla urunleri degistirebilirdi. Bu yuzden e-posta esitligi
-- de sart. Panel kullanicisini bu e-postayla olustur; degistirirsen burayi da
-- degistir, yoksa panel yazma yapamaz.
create policy ekle_u on urunler for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy guncel_u on urunler for update to authenticated
  using      (auth.jwt() ->> 'email' = 'setuphane@gmail.com')
  with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_u on urunler for delete to authenticated
  using      (auth.jwt() ->> 'email' = 'setuphane@gmail.com');

-- ── Baslangic verisi ────────────────────────────────────────────────────
-- Koddaki katalogla ayni 61 urun. Panelden degistirdikce burasi gecerliligini
-- yitirir; kaynak artik veritabani, bu blok yalnizca ilk doldurma icindir.
insert into urunler (kat, ad, kaynak, gorsel, link, anahtar, sira) values
('mousepad','Axgamingpunk Nex Poron Mousepad','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/axgamin-nex-turuncu_350x.png?v=1774465152','https://ulugames.com.tr/products/axgamingpunk-nex-poron-mousepad?bg_ref=CsmfVOpQxV','{mousepad,"mouse pad",mouse,fare,"fare pedi",poron,turuncu}',10),
('mousepad','Ulugames Drift Speed Mousepad','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/Drift-Kanashii-N_1_350x.png?v=1772215598','https://ulugames.com.tr/products/ulugames-drift-speed-mousepad?bg_ref=CsmfVOpQxV','{mousepad,"mouse pad",mouse,fare,speed,"hızlı",illüstrasyon,tasarım}',20),
('mousepad','UluGames Aruw Hybrid Mousepad','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/Kitsune_350x.png?v=1772215666','https://ulugames.com.tr/products/ulugames-aruw-hybrid-mousepad?bg_ref=CsmfVOpQxV','{mousepad,"mouse pad",mouse,fare,tilki,anime,illüstrasyon,tasarım}',30),
('mousepad','UluGames GlassPad Cam Mousepad','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/UluGames-luna-yazisiz-shpfy.png?v=1758226595&width=400','https://ulugames.com.tr/products/ulugames-cam-mousepad?bg_ref=CsmfVOpQxV','{mousepad,"mouse pad",mouse,fare,cam,"hızlı",kaygan,"rekabetçi",fps,"nişan"}',40),
('mousepad','Axgamingpunk Jade Poron Mousepad','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/axgamin-jade-kirmizi.png?v=1774465199&width=400','https://ulugames.com.tr/products/axgamingpunk-jade-poron-mousepad?bg_ref=CsmfVOpQxV','{mousepad,"mouse pad",mouse,fare,poron,dengeli,"kırmızı"}',50),
('mousepad','Wraith Blade X Semi-Hard Mousepad','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/BladeX-product-1.png?v=1688064815&width=400','https://wraithesports.com/products/blade-x-semi-hard-mousepad','{mousepad,"mouse pad",mouse,fare,sert,"yarı sert","hızlı",kontrol}',60),
('mousepad','Wraith Cosmic Glass V2 Cam Mousepad','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/cosmic-glass-1.png?v=1774873673&width=400','https://wraithesports.com/products/wraith-cosmic-glass-v2-cam-mousepad','{mousepad,"mouse pad",mouse,fare,cam,kaygan,"hızlı","rekabetçi"}',70),
('mousepad','Wraith Litepad Mousepad','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Untitled-1.jpg?v=1739273156&width=400','https://wraithesports.com/products/wraith-litepad-mousepad','{mousepad,"mouse pad",mouse,fare,"kumaş",ince,"uygun fiyat","başlangıç"}',80),
('mousepad','Wraith Ace Series Poron Mousepad','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Surge_43x48_Koyu_Mavi.png?v=1780660479&width=400','https://wraithesports.com/products/wraith-ace-series-poron-mousepad','{mousepad,"mouse pad",mouse,fare,poron,dengeli,xl,"büyük"}',90),

('kablo','Wraith Çift Başlıklı Kablo','Wraith Esports','https://wraithesports.com/cdn/shop/files/Siyah_79a34e20-32ba-43ea-bee6-46f4b453683e_350x.png?v=1759217239','https://wraithesports.com/products/wraith-cift-baslikli-kablo','{kablo,"kablo yönetimi","kablo düzeni","kablo karmaşası",klavye,mouse,fare,usb,type-c,"çift çıkış",8000hz,toparla}',10),
('kablo','Wraith Çift Yönlü Coiled Kablo','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Beyaz.jpg?v=1776321352&width=400','https://wraithesports.com/products/wraith-bidirectional-coiled-kablo','{kablo,coiled,spiral,klavye,usb,type-c,"düzen",estetik}',20),
('kablo','Hm Lab 8000Hz RGB Kablo','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/cable2.webp?v=1773946172&width=400','https://ulugames.com.tr/products/hmlab-8000hz-rgb-kablo?bg_ref=CsmfVOpQxV','{kablo,mouse,fare,8000hz,rgb,"ışıklı",paracord}',30),
('kablo','Ipi Çift Başlı 8000Hz USB Kablo','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/103348298.webp?v=1779319709&width=400','https://ulugames.com.tr/products/ipi-cift-basli-8000hz-usb-kablo?bg_ref=CsmfVOpQxV','{kablo,mouse,fare,8000hz,usb,"çift çıkış",dongle}',40),
('kablo','HM Lab Z-Neo 8K Gaming Hub','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/Black_PinkGrungeComingSoonInstagramPostKopyasi_2.png?v=1760832990&width=400','https://ulugames.com.tr/products/hm-lab-z-neo-8k-gaming-hub?bg_ref=CsmfVOpQxV','{"usb hub",hub,"çoklayıcı",port,kablo,"düzen",8k,dongle}',50),
('kablo','HM Lab HUB Little USB Hub','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/back_4f129a73-b2f2-4e15-9d5e-a58a174ccc38.png?v=1784204376&width=400','https://wraithesports.com/products/hm-lab-hub-little-usb-hub','{"usb hub",hub,"çoklayıcı",port,kablo,"düzen","küçük",kompakt}',60),

('bilek','Ulugames Bilek Desteği','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/Ulugames-bilek-destegi-1.png?v=1776359098&width=400','https://ulugames.com.tr/products/ulugames-bilek-destegi?bg_ref=CsmfVOpQxV','{bilek,"bilek desteği","ağrı",konfor,destek,klavye,"uzun oturum",ergonomi}',10),
('bilek','Wraith Ahşap Bilek Desteği','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Bilek_Destegi.jpg?v=1738594158&width=400','https://wraithesports.com/products/wraith-ahsap-bilek-destegi','{bilek,"bilek desteği","ahşap",klavye,konfor,ergonomi,"ağrı"}',20),
('bilek','Wraith Alüminyum Bilek Desteği','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/60mavi.png?v=1774882220&width=400','https://wraithesports.com/products/wraith-aluminyum-bilek-destegi','{bilek,"bilek desteği","alüminyum",metal,klavye,konfor,ergonomi}',30),
('bilek','Lofree Tofu Bilek Desteği','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Tofu.png?v=1771922682&width=400','https://wraithesports.com/products/lofree-tofu-bilek-destegi','{bilek,"bilek desteği","yumuşak",jel,konfor,"ağrı","uzun oturum"}',40),
('bilek','LUMINKEY Split Bilek Desteği','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Black-CF.png?v=1756190275&width=400','https://wraithesports.com/products/luminkey-split-bilek-destegi','{bilek,"bilek desteği","ayrık",split,karbon,klavye,ergonomi}',50),

('tustakimi','Ulugames Şeffaf Keycap Seti','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/seffaf-siyah-k.png?v=1776354786&width=400','https://ulugames.com.tr/products/ulugames-seffaf-keycap-seti?bg_ref=CsmfVOpQxV','{keycap,"tuş takımı","tuş",klavye,"şeffaf",rgb,"özelleştir",mekanik}',10),
('tustakimi','Outemu White Jade Manyetik Switch','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/H902e9881f2dd4c2cbb812b7ec1c0abb4I.jpg?v=1766766333&width=400','https://ulugames.com.tr/products/outemu-white-jade-manyetik-switch?bg_ref=CsmfVOpQxV','{switch,anahtar,manyetik,"hall effect",he,klavye,"rapid trigger",mekanik}',20),
('tustakimi','Wraith Çift Enjeksiyonlu PBT Türkçe Tuş Takımı','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/BlackandWhite.png?v=1723474319&width=400','https://wraithesports.com/products/wraith-turkce-keycap-seti','{keycap,"tuş takımı","tuş",klavye,pbt,"türkçe",solmaz,mekanik}',30),
('tustakimi','Wraith Işık Geçirgen PBT Türkçe Tuş Takımı','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/wraith-st-b-2.png?v=1785482966&width=400','https://wraithesports.com/products/wraith-isik-gecirgen-cift-enjeksiyonlu-pbt-turkce-tus-takimi','{keycap,"tuş takımı","tuş",klavye,pbt,"türkçe",rgb,"ışık geçirgen","shine through"}',40),
('tustakimi','Cherry Screw-in Stabilizer','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/60_32dd506e-d07e-4687-85b8-df657cd27644.png?v=1756891555&width=400','https://wraithesports.com/products/cherry-screw-in-stabilizer','{"stabilizatör",stabilizer,klavye,"boşluk tuşu","takırtı",mod,"özelleştir"}',50),
('tustakimi','Wraith Klavye Lube Kit','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/4.jpg?v=1757672161&width=400','https://wraithesports.com/products/wraith-klavye-lube-kit','{lube,"yağ",klavye,switch,mod,sessiz,"özelleştir","bakım"}',60),

('mouseaksesuar','UluGames Universal Dot Skates','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/ggskate_600x800piksel.png?v=1756046104&width=400','https://ulugames.com.tr/products/ulugames-universal-dot-skates-100-ptfe-cam?bg_ref=CsmfVOpQxV','{skate,paten,"kaydırıcı",mouse,fare,ptfe,"kayganlık",universal}',10),
('mouseaksesuar','3M Mouse Grip Tape','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/image_2025_02_24T19_53_14_428Z_6cdd0a4a-c197-497f-95f2-e32e4c662ff5.png?v=1740428522&width=400','https://ulugames.com.tr/products/orjinal-3m-grip-tape?bg_ref=CsmfVOpQxV','{grip,"grip tape",bant,mouse,fare,kavrama,terleme,"tutuş"}',20),
('mouseaksesuar','Attack Shark X3 / X3 Pro Yedek Skates','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/Paragrafmetniniz.png?v=1736024817&width=400','https://ulugames.com.tr/products/attack-shark-x3-ve-x3-pro-yedek-skates?bg_ref=CsmfVOpQxV','{skate,paten,"kaydırıcı",mouse,fare,"attack shark",yedek}',30),
('mouseaksesuar','Universal Hoverpad V3 Mouse Skate','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/profil_1.png?v=1751290516&width=400','https://wraithesports.com/products/universal-hoverpad-v2-mouse-skate','{skate,paten,"kaydırıcı",mouse,fare,hoverpad,universal,"kayganlık"}',40),
('mouseaksesuar','Universal Kesim Grip Tape V2','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/grip_tape_siyah2.jpg?v=1701342013&width=400','https://wraithesports.com/products/universal-kesim-grip-tape-v2','{grip,"grip tape",bant,mouse,fare,kavrama,terleme,universal}',50),
('mouseaksesuar','Wraith Glass Mouse Skates','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/glass.png?v=1755687828&width=400','https://wraithesports.com/products/wraith-glass-mouse-skates','{skate,paten,cam,mouse,fare,"hızlı","kayganlık"}',60),

('rgb','TRYX ROTA SL ARGB Kasa Fanı','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Beyaz1_02f731c6-ce17-49b5-b70b-c74ab8e25d3b.png?v=1758279955&width=400','https://wraithesports.com/products/tryx-rota-sl-argb-kasa-fani','{rgb,argb,"ışık",fan,"kasa fanı",aydınlatma,"soğutma",senkron}',10),
('rgb','APNX FP1-R ARGB Kasa Fanı','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/fp1-r_siyah.jpg?v=1737116914&width=400','https://wraithesports.com/products/apnx-fp1-r-kasa-fani','{rgb,argb,"ışık",fan,"kasa fanı",aydınlatma,"soğutma"}',20),
('rgb','AsiaHorse Hydrus ARGB PSU Uzatma Kablosu','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/kapak_516272cd-48e1-4b7d-a88a-180a54633221.png?v=1761734940&width=400','https://wraithesports.com/products/asiahorse-hydrus-argb-uzatma-kablosu','{rgb,argb,"ışık",kablo,uzatma,psu,"kasa içi",aydınlatma,estetik}',30),

('sesgoruntu','MiraBox N3 Stream Deck','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/mirabox-n3-white.png?v=1781964837&width=400','https://ulugames.com.tr/products/mirabox-n3-stream-deck?bg_ref=CsmfVOpQxV','{"stream deck","yayın",stream,"kısayol","tuş",obs,twitch,kontrol}',10),
('sesgoruntu','MiraBox N4 Pro Stream Deck','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/mirabox-n4-pro-black.png?v=1781964239&width=400','https://ulugames.com.tr/products/mirabox-n4-pro-stream-deck?bg_ref=CsmfVOpQxV','{"stream deck","yayın",stream,"kısayol",obs,twitch,"ekranlı",kontrol}',20),
('sesgoruntu','MiraBox XL Stream Deck','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/mirabox-xl-mini-black.png?v=1781913356&width=400','https://ulugames.com.tr/products/mirabox-xl-stream-deck?bg_ref=CsmfVOpQxV','{"stream deck","yayın",stream,"kısayol",obs,twitch,"büyük",kontrol}',30),
('sesgoruntu','Maono PD100X Dinamik Mikrofon','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/1_25dbaa54-082d-48dd-95f8-f6d560185c37.png?v=1751269766&width=400','https://wraithesports.com/products/maono-pd100x-dynamic-mikrofon','{mikrofon,ses,"yayın",stream,podcast,"kayıt",dinamik,xlr}',40),
('sesgoruntu','Maonocaster G1 NEO Audio Mixer','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/1_a9c42b80-b47f-4b2f-b6f5-78f09b6bfa00.png?v=1751268563&width=400','https://wraithesports.com/products/maonocaster-g1-neo-audio-mixer','{"ses kartı",mikser,mixer,"yayın",stream,podcast,mikrofon,ses}',50),
('sesgoruntu','OBSBOT Meet SE Webcam','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/White_b5ccb64f-2e86-4111-a445-dc1b0c2e08a9.png?v=1751265690&width=400','https://wraithesports.com/products/obsbot-meet-se-webcam','{webcam,kamera,"görüntü","toplantı","yayın",stream,zoom}',60),
('sesgoruntu','OBSBOT Tiny 2 Lite Webcam','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/1_ef5cec90-0076-4e60-8883-14b3d0df30ff.png?v=1751266067&width=400','https://wraithesports.com/products/obsbot-tiny-2-webcam','{webcam,kamera,"görüntü",takip,"yayın",stream,ptz,4k}',70),

('standlar','Spyne Axis-1 Monitör Kolu','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/1a-w.png?v=1775066863&width=400','https://wraithesports.com/products/spyne-axis-1-monitor-kolu','{"monitör",stand,kol,ayak,"yükseklik",ergonomi,boyun,"masada yer"}',10),
('standlar','Spyne Axis-2 Monitör Kolu (Çift)','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/2a-w.png?v=1775066447&width=400','https://wraithesports.com/products/spyne-axis-2-monitor-kolu','{"monitör",stand,kol,"çift monitör",ikili,"yükseklik",ergonomi}',20),
('standlar','Wraith Studio HP-01 Mikrofon Standı','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/hp1.png?v=1762944850&width=400','https://wraithesports.com/products/wraith-studio-hp-01-mikrofon-kolu','{"mikrofon kolu",stand,mikrofon,"yayın",stream,podcast,masa}',30),
('standlar','Spyne Atlas Yükseklik Ayarlı Masa','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Spyne-Siyah-160-1.png?v=1786715946&width=400','https://wraithesports.com/products/spyne-atlas-tek-motorlu-masa','{masa,"yükseklik ayarlı","ayakta çalışma",ergonomi,motorlu,setup}',40),

('kontrolcu','MOJHON Blitz 2 Oyun Kolu','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/blitz_2.png?v=1782900785&width=400','https://wraithesports.com/products/mojhon-blitz-2-alps-oyun-kolu','{"oyun kolu",kumanda,gamepad,controller,joystick,pc,konsol}',10),
('kontrolcu','Fantech Nova Pro V2 Oyun Kolu','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Nova_Pro_V2_Siyah.png?v=1760093561&width=400','https://wraithesports.com/products/fantech-nova-pro-wgp14-v2','{"oyun kolu",kumanda,gamepad,controller,kablosuz,pc}',20),
('kontrolcu','FLYDIGI Charging Dock 2 Pro Şarj Ünitesi','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/pro.png?v=1770273572&width=400','https://wraithesports.com/products/flydigi-charging-dock-2-kablosuz-sarj-unitesi','{"şarj","şarj istasyonu",dock,kumanda,"oyun kolu",kablosuz,"düzen"}',30),
('kontrolcu','Pulsar Supergrip Dualsense Grip Tape','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/11_2f2ab058-9718-422a-af9a-6e768b8ada62.png?v=1772111705&width=400','https://wraithesports.com/products/pulsar-supergrip-dualsense-grip-tape','{grip,"grip tape",kumanda,dualsense,ps5,kavrama,terleme}',40),

('dekor','UluGames Sleeve','Ulugames','https://cdn.shopify.com/s/files/1/0607/2264/3053/files/yeniprinton.png?v=1768753151&width=400','https://ulugames.com.tr/products/ulugames-sleeve?bg_ref=CsmfVOpQxV','{sleeve,kolluk,"kişiselleştirme",estetik,oyuncu,aksesuar}',10),
('dekor','Wraith Studio Jungle Maze Deskmat','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Acik_Mavi.png?v=1760427854&width=400','https://wraithesports.com/products/wraith-studio-jungle-maze-deskmat','{deskmat,"masa örtüsü",xl,dekor,masa,estetik,desen}',20),
('dekor','Wraith Kitsune Edition Deskmat','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Kitsune.png?v=1776088228&width=400','https://wraithesports.com/products/wraith-kitsune-deskmat','{deskmat,"masa örtüsü",xl,dekor,anime,tilki,estetik}',30),
('dekor','Wraith Studio Daydream Deskmat','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/Beyaz_87c1cd1a-1178-4d42-acf7-5956d463d772.png?v=1776080419&width=400','https://wraithesports.com/products/wraith-studio-daydream-deskmat','{deskmat,"masa örtüsü",xl,dekor,sade,beyaz,estetik}',40),
('dekor','Wraith Esports Arm Sleeve','Wraith Esports','https://cdn.shopify.com/s/files/1/0564/0096/9921/files/kitsune-parmakli.png?v=1762437101&width=400','https://wraithesports.com/products/wraith-esports-arm-sleeve','{sleeve,kolluk,"kişiselleştirme",estetik,oyuncu,"sürtünme"}',50);
