-- Haftalık fırsat köşesi (/firsatlar) — 14.10.2026
-- Supabase > SQL Editor > yapıştır > Run. Tabloyu düşürmez, veri silmez.
--
-- NE YAPAR
--   1) urunler tablosuna iki kolon ekler:
--        firsat      -> panelde "BU HAFTANIN SEÇİMİ" kutusu bunu işaretler
--        firsat_not  -> kartın altında görünen tek cümlelik gerekçe
--   2) kat sütunundaki CHECK'e 'diger' ekler, böylece fırsat köşesine mevcut
--      aksesuar kategorilerine girmeyen bir ürün de eklenebilir.
--
-- NEDEN BÖYLE
--   /firsatlar sayfası iki bölüm: üstte fiyatını KENDİMİZ takip ettiğimiz
--   parçaların doğrulanmış düşüşleri (komisyon yok), altta panelden seçilen
--   iş birliği önerileri (komisyonlu, her kartta yazıyor). İkinci bölümde
--   indirim İDDİA EDİLMEZ; aksesuar fiyat geçmişini tutmadığımız için
--   doğrulayamadığımız bir iddiayı yazmıyoruz.

alter table urunler add column if not exists firsat     boolean not null default false;
alter table urunler add column if not exists firsat_not text;

-- Not alanı kart altında aynen görünüyor; uzun metin tasarımı bozar.
alter table urunler drop constraint if exists urunler_firsat_not_uzunluk;
alter table urunler add  constraint urunler_firsat_not_uzunluk
  check (firsat_not is null or char_length(firsat_not) <= 90);

-- Fırsat köşesi sorgusu: aktif=true and firsat=true, sira'ya göre.
create index if not exists urunler_firsat_idx on urunler (firsat, sira) where firsat;

-- Kategori listesine 'diger' eklendi (CHECK yeniden kuruluyor; mevcut
-- değerlerin hepsi listede, hiçbir satır reddedilmez).
alter table urunler drop constraint if exists urunler_kat_check;
alter table urunler add  constraint urunler_kat_check check (kat in (
  'mousepad','kablo','bilek','tustakimi','mouseaksesuar',
  'rgb','sesgoruntu','standlar','kontrolcu','dekor',
  'mouse','klavye','diger'));

notify pgrst, 'reload schema';

-- KONTROL (isteğe bağlı, çalıştırınca 0 satır dönmeli = her şey yolunda):
-- select kat, count(*) from urunler group by kat order by 2 desc;
-- select ad, firsat, firsat_not from urunler where firsat;
