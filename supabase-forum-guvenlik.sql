-- SETUP HANE — forum tablolarinda gizlilik ve kotuye kullanim sertlestirmesi
-- 17.08.2026'da uygulandi. supabase-kurulum.sql BASTAN kurdugu icin, o betigi
-- yeniden calistirirsan BU betigi de tekrar calistirman gerekir; yoksa
-- asagidaki korumalar geri gitmis olur.

-- ── 1) Yazarin cihaz kimligini herkese acmayi birak ───────────────────────
-- Sorun: konular.cihaz ve cevaplar.cihaz anon anahtarla okunabiliyordu.
-- begeniler tablosunda ayni kimlik durdugu icin "bu cihaz sunlari yazdi,
-- sunlari begendi" seklinde bir profil cikarilabiliyordu. Site bu sutunu
-- zaten hicbir ekranda okumuyor, sadece yaziyor.
--
-- Not: sutun bazli REVOKE, tablo geneli GRANT'i kucultmez. Once tablo
-- genelini geri alip sonra yalnizca gerekli sutunlari vermek gerekiyor.
revoke select on konular  from anon, authenticated;
revoke select on cevaplar from anon, authenticated;

grant select (id, kat, baslik, govde, yazar, renk, sabit, olusturma)
  on konular to anon, authenticated;
grant select (id, konu_id, govde, yazar, renk, olusturma)
  on cevaplar to anon, authenticated;

-- Bunun bir yan etkisi var: PostgREST'e "eklenen satiri geri ver"
-- (Prefer: return=representation) dendiginde tum sutunlara okuma hakki
-- ariyor ve 401 doner. Site kodu bu yuzden forum eklemelerinde
-- return=minimal kullaniyor — orayi degistirirsen forum gonderimi kirilir.

-- ── 2) cihaz alanina uzunluk siniri ───────────────────────────────────────
-- Sorun: cihaz sutununda hicbir sinir yoktu; tek istekle megabaytlarca veri
-- yazip ucretsiz plandaki depolamayi sisirmek mumkundu.
alter table konular   add constraint konular_cihaz_boy   check (char_length(cihaz) <= 64);
alter table cevaplar  add constraint cevaplar_cihaz_boy  check (char_length(cihaz) <= 64);
alter table begeniler add constraint begeniler_cihaz_boy check (char_length(cihaz) <= 64);

notify pgrst, 'reload schema';

-- ── HALA ACIK OLAN, KOD/SQL ILE COZULEMEYEN KONULAR ──────────────────────
-- a) Begeni sayisi sisirilebilir: cihaz kimligini istemci belirliyor, bu
--    yuzden biri uydurma kimliklerle istedigi kadar begeni ekleyebilir.
--    Gercek cozum begeniyi kimlige baglamak (uye girisi) ya da Supabase
--    tarafinda hiz siniri koymak.
-- b) Begeniler silinebilir: politika "for delete using (true)" — biri tum
--    begenileri silebilir. Kimlik dogrulamasi olmadan "sadece kendi
--    begenini sil" kurali guvenilir sekilde yazilamiyor.
-- c) Konu/cevap spami: yazma herkese acik ve hiz siniri yok. Uzunluk
--    kisitlari var ama satir sayisi sinirsiz.
-- Uclu icin de dogru yer Supabase > Auth/API rate limit ayarlari veya
-- forumu uye girisine baglamak.
