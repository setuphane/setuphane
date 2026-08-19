-- SETUP HANE - laptop tablosu (/panel > LAPTOPLAR bunu yonetir)
-- Supabase > SQL Editor > yapistir > Run.  DIKKAT: bastan kurar.
--
-- Tablo bos oldugunda panelde "KODDAKI LISTEYI ICERI AKTAR" dugmesi cikar;
-- kodda duran liste tek tikla buraya yazilir. Bu yuzden burada INSERT yok.

drop table if exists laptoplar cascade;

create table laptoplar (
  id uuid primary key default gen_random_uuid(),
  ad     text not null check (char_length(ad) between 5 and 200),
  marka  text not null check (char_length(marka) between 2 and 40),
  fiyat  int  not null check (fiyat > 0),
  gorsel text not null check (gorsel ~ '^https://'),
  link   text not null check (link ~ '^https://'),
  -- gpu: koddaki GPU_IDX anahtarlariyla ayni yazilmali ('rtx 5070' gibi).
  -- Guc puani (idx) BILEREK burada yok: kodda GPU_IDX'ten turetiliyor,
  -- boylece panelden yanlis bir guc degeri girilip FPS tahminleri sessizce
  -- bozulamiyor.
  gpu    text not null,
  cpu    text,
  ram    int,
  ssd    int,
  inch   text,
  saticilar int not null default 0,
  sira   int not null default 0,
  aktif  boolean not null default true,
  guncelleme timestamptz not null default now(),
  -- Ayni laptop iki kez yazilamasin: "iceri aktar" dugmesine ikinci kez
  -- basilirsa 49 kaydin kopyasi olusuyordu.
  constraint laptoplar_ad_uniq unique (ad)
);
create index laptoplar_fiyat_idx on laptoplar (fiyat);

alter table laptoplar enable row level security;
create policy oku_l on laptoplar for select using (true);

-- Yazma yalnizca yoneticiye. "to authenticated" tek basina YETMEZ: kayit
-- acik olsaydi herhangi biri hesap acip bu hakki alirdi.
create policy ekle_l   on laptoplar for insert to authenticated with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy guncel_l on laptoplar for update to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com') with check (auth.jwt() ->> 'email' = 'setuphane@gmail.com');
create policy sil_l    on laptoplar for delete to authenticated using (auth.jwt() ->> 'email' = 'setuphane@gmail.com');

notify pgrst, 'reload schema';
