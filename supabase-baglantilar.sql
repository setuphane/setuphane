-- /baglantilar — Instagram videolarında geçen ürünlerin bağlantıları
-- 03.11.2026 tarihinde Supabase MCP ile UYGULANDI (migration: baglantilar_videolar).
-- Bu dosya kayıt içindir; tekrar çalıştırmaya gerek yok. Çalıştırılırsa
-- "if not exists" sayesinde tablolara zarar vermez, ama policy'ler zaten
-- var olduğu için "already exists" hatası verir.
--
-- Model: bir video, altında birden fazla ürün. Video bir kez eklenir,
-- ürünler altına eklenir. Video silinirse ürünleri de silinir (cascade).
-- RLS: urunler/parcalar ile aynı — okuma herkese açık, yazma yalnızca
-- setuphane@gmail.com oturumuyla (panel). Anonim yazma denemesi 401 döner
-- (03.11'de dışarıdan denendi).

create table if not exists public.videolar (
  id        uuid primary key default gen_random_uuid(),
  baslik    text not null check (char_length(baslik) between 2 and 120),
  link      text check (link is null or link ~ '^https://'),
  tarih     date not null default current_date,
  sira      int  not null default 0,
  aktif     boolean not null default true,
  olusturma timestamptz not null default now()
);

create table if not exists public.video_urunleri (
  id        uuid primary key default gen_random_uuid(),
  video_id  uuid not null references public.videolar(id) on delete cascade,
  ad        text not null check (char_length(ad) between 2 and 120),
  magaza    text check (magaza is null or char_length(magaza) <= 40),
  link      text not null check (link ~ '^https://'),
  gorsel    text check (gorsel is null or gorsel ~ '^https://'),
  sira      int  not null default 0,
  olusturma timestamptz not null default now()
);

create index if not exists videolar_tarih_idx       on public.videolar (aktif, tarih desc, sira);
create index if not exists video_urunleri_video_idx on public.video_urunleri (video_id, sira);

alter table public.videolar       enable row level security;
alter table public.video_urunleri enable row level security;

create policy oku_v    on public.videolar for select using (true);
create policy ekle_v   on public.videolar for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');
create policy guncel_v on public.videolar for update to authenticated
  using      ((auth.jwt() ->> 'email') = 'setuphane@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');
create policy sil_v    on public.videolar for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');

create policy oku_vu    on public.video_urunleri for select using (true);
create policy ekle_vu   on public.video_urunleri for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');
create policy guncel_vu on public.video_urunleri for update to authenticated
  using      ((auth.jwt() ->> 'email') = 'setuphane@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');
create policy sil_vu    on public.video_urunleri for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'setuphane@gmail.com');

notify pgrst, 'reload schema';
