# Durum — 24.08.2026

Çalışmaya devam eden herkes (ve yeni bir Claude oturumu) için özet.
Kalıcı kurallar `CLAUDE.md`'nin sonundaki "SETUP HANE" bölümünde.

## ⚠️ BEKLEYEN MANUEL ADIM — veritabani fiyatlarla senkron degil

Bugun (24.08.2026) 11 parca fiyati Epey'de dogrulanip **kodda** guncellendi
ve push edildi (commit 286bdcf). Ama **Supabase oturumu SQL Editor'e girince
sign-in sayfasina yonlendiriyordu** (muhtemelen 3 gundur kullanilmadigi icin
oturum dusmus). Claude kimlik bilgisi giremez, bu adimi kullanici yapmali.

**Yapilacak:** Supabase'e giris yap, sonra SQL Editor'e su dosyayi yapistir
ve calistir (kullaniciya SendUserFile ile gonderildi, ayrica
`.supabase-guncelle.sql` olarak proje kokunde duruyor — gitignore'da,
depoya girmiyor):

```sql
update parcalar set fiyat = 20613 where anahtar = 'gpu:5060';
update parcalar set ad = 'GeForce RTX 5060 Ti 16 GB (MSI Shadow 2X OC Plus)', fiyat = 39595 where anahtar = 'gpu:5060ti';
update parcalar set fiyat = 37829 where anahtar = 'gpu:5070';
update parcalar set ad = 'GeForce RTX 5070 Ti 16 GB (Gigabyte WindForce SFF)', fiyat = 62777 where anahtar = 'gpu:5070ti';
update parcalar set fiyat = 78140 where anahtar = 'gpu:5080';
update parcalar set fiyat = 263209 where anahtar = 'gpu:5090';
update parcalar set fiyat = 4699 where anahtar = 'ssd:500';
update parcalar set fiyat = 7643 where anahtar = 'ssd:1t';
update parcalar set fiyat = 12739 where anahtar = 'ram:16';
update parcalar set fiyat = 3999 where anahtar = 'kasa:1';
update parcalar set ad = 'Camlı, yüksek hava akışlı kasa (Corsair Frame 4500X RS-R ARGB)', fiyat = 8819 where anahtar = 'kasa:2';

notify pgrst, 'reload schema';
```

Calistirilana kadar **canli site eski fiyatlari gosteriyor** (Supabase, kod
yedeginden once okunuyor). Calistirildiktan sonra bu bolumu silin.

## Şu an ne durumdayız

| Alan | Durum |
|---|---|
| 45 parça fiyatı (Epey, 3+ satıcı kuralı) | **kodda güncel (24.08), veritabanı geride** ⚠️ yukarı bak |
| Masaüstü kart ve işlemci gücü (TechPowerUp) | ölçüme bağlandı |
| Çözünürlük katsayıları, kart bazlı (r1440/r2160) | ölçüme bağlandı |
| 45 laptop fiyatı + satıcı sayısı (Cimri) | doğrulandı (21.08, bu turda dokunulmadı) |
| Laptop kart gücü (NotebookCheck oyun testleri) | ölçüme bağlandı |
| 55 aksesuar linki | 55/55 canlı (21.08'de) |
| 9 OEM hazır sistem (İncehesap) + karşılaştırma | canlıda |
| Sert kurallar | soket, watt, radyatör-kasa, PCIe x4, kart-kasa, anakart-kasa, bellek türü, VRAM, RAM, disk |
| Denetim | 11.611 kombinasyon, **uyumsuzluk yok** (24.08'de tekrar doğrulandı) |

Veritabanı: `parcalar` 46, `laptoplar` 45, `urunler` 55 satır — **kodla eşit değil**,
yukarıdaki SQL çalıştırılana kadar.

### 24.08.2026 fiyat tazeleme — neler değişti

Epey'de tam model adıyla tek tek doğrulandı (script'in kendi eşleştirmesi
güvenilmedi, bkz. commit 286bdcf mesajı). Gerçek değişenler:

- **RTX 5060 Ti**: ad hatası da vardı — "MSI Shadow 2X OC" (8 GB) ile
  16 GB VRAM tutarsızdı. Gerçek 16 GB model "Shadow 2X OC **Plus**".
  32.058 → 39.595 ₺
- **RTX 5070 Ti**: Palit GamingPro 2 satıcıya düştü (kural: min 3).
  Gigabyte WindForce SFF'e geçildi. 61.080 → 62.777 ₺
- **Kasa (Corsair)**: 4000D RS ARGB üretimden kalkmış, yerine yeni nesil
  **4500X RS-R ARGB**. GPU max 430→460mm, radyatör 360mm aynı kaldı.
  6.270 → 8.819 ₺
- NZXT H3 Flow 3.256 → 3.999 ₺ (%23)
- RTX 5060/5070/5080/5090, SSD 500GB/1TB, RAM 16GB: %3-12 artış

`fiyat-denetimi.mjs` script'i BOARDS'u hiç denetlemiyordu ve COOLERS/PSUS
kuralları eski katalog id'lerine göreydi (360mm cooler, 750W/1200W PSU hiç
kontrol edilmiyordu) — script henüz düzeltilmedi, bir sonraki tazelemede
elle doğrulamaya devam edilmeli ya da script güncellenmeli.

## Açık karar — kullanıcıya soruldu, cevap bekliyor

**Motoru seçilen oyuna duyarlı hale getirmek.**
Şu an motor "ortalama bir oyun" için optimize ediyor; ziyaretçi ise belirli
bir oyun seçiyor. Sonuç: bazı bütçe noktalarında bütçe artınca FPS düşüyor.
Örnek: 143.455 ₺'de motor Ryzen 7 9800X3D'yi (oyun gücü 125) bırakıp 9700X'e
(104) geçiyor ve RTX 5070 Ti yerine RTX 5080 alıyor. Ağır oyunda kazanç,
işlemciye yaslanan hafif oyunda kayıp.

Kapsam ölçüldü: yalnızca 1080p, yalnızca işlemciye bağlı oyunlar
(Valorant %6, LoL %8, CS2 %9, PUBG %7, Fortnite %1), her birinde 2 bütçe
noktası. 1440p ve 4K'da yok, ağır oyunlarda yok.

Kök neden: tek bir denge sabiti (1.32) hem CS2'yi hem Cyberpunk'ı temsil
edemiyor — ck/k oranı CS2'de 1.06, Cyberpunk'ta 1.74.

Geçici çözüm uygulandı: "tatlı nokta" paneli, ucuz sistem **daha hızlıysa**
eşiğe bakmadan uyarıyor. Ziyaretçi yanlış sistemle baş başa kalmıyor.
Kalıcı çözüm öneri davranışını bütün sitede değiştireceği için kullanıcının
kararı bekleniyor.

## Yapılacaklar

- **9 ekran kartının uzunluğu ölçülmedi.** Kart-kasa kuralı yalnızca
  RTX 5090'da (304 mm, TechPowerUp) uygulanabiliyor. TechPowerUp'ın arama ve
  liste uçları 410 dönüyor, Epey kart uzunluğu yayınlamıyor. Denetim bu 9
  kartı her çalıştığında raporluyor. Başka kaynak bulunmalı.
- **Alternatif öneriler (±%3).** Motor zaten bütün kombinasyonları deniyor;
  2. ve 3. en iyi sistem neredeyse bedavaya saklanabilir.
- **220 / 300 / 350 / 400 bin bandında OEM sistem yok.** İncehesap'ta o
  aralıkta paket yok. Sinerji/İtopya eklenirse dolar; tarayıcı yapısı hazır.
- **OEM listesi panelden yönetilmiyor**, şimdilik yalnızca kodda.
  Tazeleme: `node scripts/oem-sec.mjs && node scripts/oem-kod.mjs`

## Araçlar

| Komut | Ne yapar |
|---|---|
| `node scripts/kontrol.mjs` | veri bütünlüğü kapısı |
| `node scripts/kombinasyon-denetimi.mjs` | 11.611 kombinasyon, sert kurallar |
| `node scripts/gun-sonu-testi.mjs` | ziyaretçinin gördüğü tutarlılık |
| `node scripts/ornek-sistemler.mjs [profil]` | örnek sistemleri insan gözüyle oku |
| `node scripts/fiyat-denetimi.mjs` | parça fiyatlarını Epey ile karşılaştır |
| `node scripts/laptop-fiyat-denetimi.mjs` | laptop fiyatlarını karşılaştır |
| `node scripts/link-denetimi.mjs` | aksesuar linkleri canlı mı |
| `node scripts/veri-sql.mjs > supabase-parcalar.sql` | parça SQL'i üret |
| `node scripts/laptop-sql.mjs > supabase-laptoplar-guncelle.sql` | laptop SQL'i üret |

Fiyat taramaları için: Epey `curl` ile çekilebiliyor (Node fetch 403 alıyor),
Cimri yalnızca tarayıcı içinden (sayfadaki schema.org AggregateOffer alanı).

## Geri dönüş noktaları

`git tag` → `yedek-anakart-ram-oncesi` (4c3b26e). Her önemli değişiklik ayrı
commit; `git log --oneline` ile bakıp `git revert <commit>` yeterli.
