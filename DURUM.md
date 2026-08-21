# Durum — 21.08.2026

Çalışmaya devam eden herkes (ve yeni bir Claude oturumu) için özet.
Kalıcı kurallar `CLAUDE.md`'nin sonundaki "SETUP HANE" bölümünde.

## Şu an ne durumdayız

| Alan | Durum |
|---|---|
| 45 parça fiyatı (Epey, 3+ satıcı kuralı) | doğrulandı, canlıda |
| Masaüstü kart ve işlemci gücü (TechPowerUp) | ölçüme bağlandı |
| Çözünürlük katsayıları, kart bazlı (r1440/r2160) | ölçüme bağlandı |
| 45 laptop fiyatı + satıcı sayısı (Cimri) | doğrulandı |
| Laptop kart gücü (NotebookCheck oyun testleri) | ölçüme bağlandı |
| 55 aksesuar linki | 55/55 canlı |
| 9 OEM hazır sistem (İncehesap) + karşılaştırma | canlıda |
| Sert kurallar | soket, watt, radyatör-kasa, PCIe x4, kart-kasa, anakart-kasa, bellek türü, VRAM, RAM, disk |
| Denetim | 11.611 kombinasyon, **uyumsuzluk yok** |

Veritabanı: `parcalar` 46, `laptoplar` 45, `urunler` 55 satır — kodla eşitli.

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
