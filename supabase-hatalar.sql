-- SETUP HANE - hata kaydi (/panel > HATALAR bunu gosterir)
-- Site bir ziyaretcide bozulursa kimsenin haberi olmuyordu; sorunu ancak
-- elle test ederken goruyorduk. Ucuncu taraf bir servis (Sentry vb.) yerine
-- kendi veritabanimiz: React'i kendi sunucumuza aldiktan sonra yerine yeni
-- bir dis bagimlilik koymak tutarsiz olurdu.
--
-- Kisisel veri yok: tam User-Agent yerine "Chrome / Windows" gibi kaba bir
-- etiket, IP yok, kullanici kimligi yok.

drop table if exists hatalar cascade;

create table hatalar (
  id uuid primary key default gen_random_uuid(),
  mesaj    text not null check (char_length(mesaj) between 1 and 500),
  kaynak   text check (char_length(kaynak) <= 300),
  yol      text check (char_length(yol) <= 200),
  tarayici text check (char_length(tarayici) <= 80),
  cihaz    text not null check (char_length(cihaz) <= 64),
  olusturma timestamptz not null default now()
);
create index hatalar_tarih_idx on hatalar (olusturma desc);

alter table hatalar enable row level security;

-- Yazma herkese acik: hatayi bildirecek olan ziyaretcinin tarayicisi.
create policy yaz_h on hatalar for insert with check (true);
-- Okuma/silme YALNIZCA yoneticiye: hata metinleri ic detay sizdirabilir.
create policy oku_h on hatalar for select to authenticated
  using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_h on hatalar for delete to authenticated
  using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');

-- hiz_siniri() 'hatalar' icin tanimli degildi, varsayilan 100'e dusuyordu.
-- NOT: $hz$ kullaniliyor, $$ degil — betigi JS ile tasirken $$ bozuluyor.
create or replace function hiz_siniri() returns trigger
language plpgsql security definer as $hz$
declare adet int; sinir int; pencere interval := interval '1 hour';
begin
  sinir := case TG_TABLE_NAME
             when 'konular'   then 5
             when 'cevaplar'  then 20
             when 'begeniler' then 60
             when 'hatalar'   then 10
             else 100 end;
  execute format(
    'select count(*) from public.%I where cihaz = $1 and olusturma > now() - $2',
    TG_TABLE_NAME) into adet using new.cihaz, pencere;
  if adet >= sinir then
    raise exception 'Cok hizli gonderim yaptin, bir sure sonra tekrar dene.'
      using errcode = '54000';
  end if;
  return new;
end $hz$;

-- Tek bozuk sayfa veritabanini doldurmasin: cihaz basina saatte 10 kayit.
create trigger hiz_h before insert on hatalar for each row execute function hiz_siniri();

notify pgrst, 'reload schema';
