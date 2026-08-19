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
-- b) [COZULDU 19.08.2026 — asagidaki eke bak] Begeniler toplu silinebiliyordu.
-- c) [COZULDU 19.08.2026 — asagidaki eke bak] Konu/cevap spamine hiz siniri.
-- (a) hala acik: gercek cozum forumu uye girisine baglamak.

-- ═══════════════════════════════════════════════════════════════════════
-- 19.08.2026 EKI — begeni silme kapatildi + hiz siniri
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Begeni silme politikasi "using (true)" idi: tek istekle sitedeki TUM
--    begeniler silinebiliyordu. Artik istek basligi satirdaki cihazla
--    eslesmeli. Site sb() icinden X-Cihaz basligini gonderiyor; bu basligi
--    kaldirirsan begeni geri alma calismaz.
drop policy if exists sil_b on begeniler;
create policy sil_b on begeniler for delete
  using (cihaz = current_setting('request.headers', true)::json ->> 'x-cihaz');

-- 2) Hiz siniri. Kimlik dogrulamasi olmadigi icin cihaz kimligi taklit
--    edilebilir; bu sinir kararli bir saldirgani durdurmaz ama basit taskini
--    ve kazayla olan tekrari keser.
--    GENEL (tum tabloyu kapsayan) bir kota BILEREK konulmadi: saldirgan
--    kotayi doldurup gercek kullanicilari kilitleyebilirdi.
alter table begeniler add column if not exists olusturma timestamptz not null default now();

create or replace function hiz_siniri() returns trigger
language plpgsql security definer as $$
declare adet int; sinir int; pencere interval := interval '1 hour';
begin
  sinir := case TG_TABLE_NAME
             when 'konular'   then 5
             when 'cevaplar'  then 20
             when 'begeniler' then 60
             else 100 end;
  execute format(
    'select count(*) from public.%I where cihaz = $1 and olusturma > now() - $2',
    TG_TABLE_NAME) into adet using new.cihaz, pencere;
  if adet >= sinir then
    raise exception 'Cok hizli gonderim yaptin, bir sure sonra tekrar dene.'
      using errcode = '54000';
  end if;
  return new;
end $$;

drop trigger if exists hiz_k on konular;
drop trigger if exists hiz_c on cevaplar;
drop trigger if exists hiz_b on begeniler;
create trigger hiz_k before insert on konular   for each row execute function hiz_siniri();
create trigger hiz_c before insert on cevaplar  for each row execute function hiz_siniri();
create trigger hiz_b before insert on begeniler for each row execute function hiz_siniri();

notify pgrst, 'reload schema';

-- HALA ACIK: begeni sayisi sisirme. Cihaz kimligini istemci belirledigi icin
-- uydurma kimliklerle ekleme hala mumkun; hiz siniri yalnizca ayni kimlikle
-- yapilani keser. Gercek cozum forumu uye girisine baglamak.
