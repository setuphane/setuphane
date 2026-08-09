create extension if not exists pgcrypto;

create table konular (
  id uuid primary key default gen_random_uuid(),
  kat text not null check (kat in ('tavsiye','sorun','firsat','kurulum','genel')),
  baslik text not null check (char_length(baslik) between 8 and 90),
  govde  text not null check (char_length(govde) between 15 and 4000),
  yazar  text not null check (char_length(yazar) between 3 and 18),
  renk   text not null check (renk ~ '^#[0-9A-Fa-f]{6}$'),
  cihaz  text not null,
  sabit  boolean not null default false,
  olusturma timestamptz not null default now()
);

create table cevaplar (
  id uuid primary key default gen_random_uuid(),
  konu_id uuid not null references konular(id) on delete cascade,
  govde text not null check (char_length(govde) between 2 and 2000),
  yazar text not null check (char_length(yazar) between 3 and 18),
  renk  text not null check (renk ~ '^#[0-9A-Fa-f]{6}$'),
  cihaz text not null,
  olusturma timestamptz not null default now()
);

create table begeniler (
  konu_id uuid not null references konular(id) on delete cascade,
  cihaz   text not null,
  primary key (konu_id, cihaz)
);

alter table konular   enable row level security;
alter table cevaplar  enable row level security;
alter table begeniler enable row level security;

-- Herkes okur
create policy oku_k on konular   for select using (true);
create policy oku_c on cevaplar  for select using (true);
create policy oku_b on begeniler for select using (true);

-- Herkes yazar (uzunluk/biçim kısıtları yukarıdaki CHECK'lerde)
create policy yaz_k on konular   for insert with check (not sabit);
create policy yaz_c on cevaplar  for insert with check (true);
create policy yaz_b on begeniler for insert with check (true);

-- Beğeni geri alınabilir; konu/cevap SİLİNEMEZ.
-- Sunucu tarafında sahiplik doğrulanamadığı için silme yetkisi verilmiyor;
-- moderasyon Supabase panelinden yapılır.
create policy sil_b on begeniler for delete using (true);
