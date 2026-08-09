# SETUP HANE

Bütçeye göre bilgisayar toplayan topluluk aracı. Tek dosyalık, bağımlılıksız,
kayıt istemeyen bir site.

- **Sistem kur** — bütçe + amaç gir, o paraya alınabilecek en iyi sistemi parça
  parça kurar. Hazır laptop karşılaştırması da var.
- **Testler** — 12 araç: FPS, ekran kartı gücü, ölü piksel, hayalet iz, klavye,
  mouse, DPI, oyun kolu, refleks ölçümleri.
- **Forum** — topluluk. Supabase bağlıysa ortak, değilse cihaz-yerel çalışır.

---

## Dosyalar

| Yol | Ne |
|---|---|
| `index.html` | **Yayına giden dosya.** Derlenmiş: JSX önceden çevrilmiş, Tailwind CSS gömülü. |
| `src/setuphane.html` | **Kaynak.** Düzenlemeler burada yapılır; `index.html` bundan üretilir. |
| `og.jpg` | Link paylaşımı önizleme görseli. |

`index.html` üretilmiş dosyadır — elle düzenleme. Değişiklik `src/setuphane.html`
üzerinde yapılır, sonra yeniden derlenir.

### Neden derleniyor?

Kaynak dosya React'i JSX ile yazıyor ve Tailwind'i CDN'den çekiyor. Bu hâliyle
tarayıcı her ziyarette ~650 KB araç indirip 200 KB JSX'i derliyor — ilk açılış
mobilde saniyeler sürüyor. Derlenmiş sürümde Babel ve Tailwind CDN tamamen yok;
dış kaynak 9'dan 4'e düştü.

---

## Vercel'e yayınlama

Depoyu GitHub'a yükle, Vercel'de **Add New → Project → Import** ile seç.
Ayar gerekmiyor: framework "Other", build komutu boş, output dizini kök.
`index.html` doğrudan sunulur. Sonraki her push otomatik yayına geçer.

---

## Forumu ortak hale getirme (Supabase)

Supabase bağlanmazsa forum cihaz-yerel çalışmaya devam eder; site bozulmaz.

**1.** [supabase.com](https://supabase.com) üzerinde ücretsiz proje aç.

**2.** SQL Editor'de şunu çalıştır:

```sql
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
```

**3.** Settings → API'den **Project URL** ve **anon public** anahtarını al.

**4.** `src/setuphane.html` içinde `SUPABASE` sabitini doldur:

```js
const SUPABASE={ url:'https://xxxx.supabase.co', anon:'eyJhbGci...' };
```

**5.** Yeniden derle ve push et.

### anon anahtarı gizli mi?

Hayır. `anon` anahtarı tarayıcıya çıkmak üzere tasarlanmıştır; koruma yukarıdaki
RLS kurallarındadır. **`service_role` anahtarını buraya asla yazma** — o anahtar
tüm kuralları atlar.

### Moderasyon

Silme yetkisi istemciye verilmedi. Uygunsuz içerik Supabase panelinde
Table Editor → `konular` / `cevaplar` üzerinden silinir.

---

## Bakım

**Fiyatlar** `src/setuphane.html` içindeki `GPUS` / `CPUS` dizilerinde gömülü ve
Cimri'den çekilmiş tarihi taşır. Bayatlayınca ana projedeki
`scripts/prices.ps1` ve `scripts/laptops.ps1` ile tazelenir (Apify kredisi harcar).

**Laptop görselleri** `cdn.cimri.io` üzerinden çekiliyor. Cimri hotlink'i
engellerse görseller kaybolur — kart yine çalışır, `onError` gizler.

---

## Ne toplanmıyor

Çerez yok, izleme yok, analitik yok. Kullanıcı adı, forum gönderileri ve test
rekorları tarayıcının `localStorage`'ında durur. Supabase bağlıysa yalnızca forum
gönderileri sunucuya gider; kullanıcı adı takma addır, e-posta istenmez.
