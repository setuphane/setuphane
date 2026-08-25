# Durum — 24.08.2026

Çalışmaya devam eden herkes (ve yeni bir Claude oturumu) için özet.
Kalıcı kurallar `CLAUDE.md`'nin sonundaki "SETUP HANE" bölümünde.

## Şu an ne durumdayız

| Alan | Durum |
|---|---|
| 45 parça fiyatı (Epey, 3+ satıcı kuralı) | doğrulandı, **kod ve veritabanı senkron** (24.08) |
| Masaüstü kart ve işlemci gücü (TechPowerUp) | ölçüme bağlandı |
| Çözünürlük katsayıları, kart bazlı (r1440/r2160) | ölçüme bağlandı |
| 45 laptop fiyatı + satıcı sayısı (Cimri) | doğrulandı (21.08, bu turda dokunulmadı) |
| Laptop kart gücü (NotebookCheck oyun testleri) | ölçüme bağlandı |
| 135 aksesuar ürünü, 12 kategori | canlıda (24.08'de 80 yeni ürün + 2 yeni kategori eklendi) |
| 9 OEM hazır sistem (İncehesap) + karşılaştırma | canlıda |
| Sert kurallar | soket, watt, radyatör-kasa, PCIe x4, kart-kasa, anakart-kasa, bellek türü, VRAM, RAM, disk |
| Denetim | 11.367 kombinasyon, **uyumsuzluk yok** (24.08'de kasa/soğutucu eşiği düzeltmesinden sonra tekrar doğrulandı) |

Veritabanı: `parcalar` 46, `laptoplar` 45, `urunler` 92 satır — kodla eşitli
(11 kalem 24.08'de REST API'den doğrulanarak güncellendi; `urunler` aynı
gün 12'den 92'ye çıktı, bkz. aşağıdaki Ulugames genişletmesi).

### 24.08.2026 — Ulugames kataloğu genişletildi: 80 yeni ürün, 2 yeni kategori

Kullanıcı Ulugames affiliate panelindeki (business.ulugames.com.tr) tüm
outlet-dışı ürünleri istedi. Panelde 103 ürün bulundu; 12'si outlet, 11'i
zaten katalogda — geriye 80 net yeni ürün kaldı.

**Kategori sorunu:** Ürünlerin çoğu (38 mouse, 32 klavye) mevcut 10
kategoriden hiçbirine tam oturmuyordu ("Mouse Aksesuarları" sadece
skate/grip, "Tuş Takımı" sadece keycap/switch içindi). Kullanıcı onayıyla
`AKSESUAR_KATEGORILERI`'ye **Mouse** ve **Klavye** eklendi.

**Veri kaynağı:** Ulugames'in kendi Shopify mağazası `ulugames.com.tr/products.json`
adresinde TÜM kataloğu (103 ürün, id/handle/tip/tag/görsel) herkese açık
JSON olarak yayınlıyor — affiliate panelindeki kart id'leri bu JSON'daki
`id` alanıyla birebir eşleşiyor. Tahmini/uydurma veri yok: isim, görsel,
kategori ipucu (product_type) hep buradan geldi. 80/80 link `curl` ile
tek tek doğrulandı (hepsi 200).

**Bulunan ve düzeltilen hata:** Kategori tespiti "kablosuz" kelimesini
"kablo" alt-dizesiyle karıştırıp bir klavyeyi (Attack Shark X98 Pro) yanlış
kategoriye düşürüyordu — word-boundary'siz regex. `\bkablo\b` ile
düzeltildi, tüm 80 satır tekrar kontrol edildi.

**Veritabanı adımı:** `urunler.kat` sütununda sabit bir CHECK constraint
vardı (10 eski kategoriyle sınırlı) — kullanıcı onayıyla `mouse` ve
`klavye` eklenecek şekilde genişletildi, sonra 80 satır INSERT edildi.
Sonuç REST API'den doğrulandı: 92 satır, kategori dağılımı beklenenle
birebir (mouse 38, klavye 32, sesgoruntu 6, kablo 4, bilek 1, + 11 eski).

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

### 24.08.2026 — "kendim toplayacağım" motor denetimi: kasa/soğutucu/anakart eşiği düzeltildi

Kullanıcı talimatı: "gereksiz kombinasyonları, eşleşmeyen/uyumsuz parçaları,
artan fiyata göre gerçek iyileştirme olup olmadığını kontrol et." Motor
kodu (`kurDene`) satır satır okunup, bütçe arttıkça skorun düştüğü noktalar
400 bütçe adımı × 4 profil × marka kısıtlarında tarandı.

**Bulunan hata:** Kasa (`pickCase`), soğutucu (`pickCooler`) ve anakart
kademesi (`pickBoard`'daki `budget>90000?2:1` terimi) SABİT bütçe eşiğiyle
zorlanıyordu (35.000/70.000 kasa, 80.000/120.000 soğutucu, 90.000 anakart).
Eşiğin hemen üstünde kademe ZORUNLU sıçrıyordu ve bu sıçrama bazen RAM/SSD
bütçesinden kesecek kadar büyüktü — **bütçe arttığı halde toplam sistem
skoru düşüyordu.** Ölçülen kapsam: 27 skor-düşüşü, 20'si doğrudan bu üç
eşikten kaynaklanıyordu (7 kasa, 13 soğutucu — anakart eşiği CPU/GPU
seçimini değiştirerek dolaylı etki ediyordu).

**Uygulanan düzeltme:** Kasa ve soğutucu artık `kurDene()`'nin arama
döngüsüne girdi — fiziksel uyum (radyatör-kasa, soğutma yeterliliği,
kart-kasa) SERT KURAL olarak kaldı, ama kademe TERCİHİ artık skora göre:
motor her uyumlu kademeyi dener, en yüksek skoru veren kazanır. Skor eşitse
(kasa/soğutucu skora hiç girmiyor, yalnızca fiyata) daha kaliteli/pahalı
kademe kazanır — **ama sadece skor hiç düşmüyorsa**, yani bütçe zaten daha
iyi RAM/SSD/GPU/CPU'ya harcanamıyorsa. Anakart kademesindeki `budget>90000`
terimi tamamen kaldırıldı (zaten CPU gücüne göre kademe yükseliyordu, bütçe
terimi gereksizdi — 65 W'lık ucuz bir CPU'yu 90 bin üstü bütçede bile B650M'e
zorlamanın teknik gerekçesi yoktu).

**Sonuç (400 bütçe adımı × 4 profil × marka taraması, önce/sonra):**
- Skor düşüşü: 27 → 5 (kalan 5'i tamamen farklı, ÖNCEDEN VAR OLAN bir
  mekanizmadan geliyor — aşağıya bkz.)
- Kasa/soğutucu kademesi kaynaklı düşüş: 20 → 0
- `gun-sonu-testi.mjs` görünür FPS düşüşü: 159 → 137
- En düşük kurulabilir bütçe (oyun): 54.334 → 52.545 ₺ (artık en ucuz kasa
  gerçekten kullanılabiliyor — eskiden 35.000 ₺ eşiği hiçbir zaman
  tetiklenmiyordu çünkü çalışan en ucuz sistem zaten 35.000'i aşıyordu)
- `kombinasyon-denetimi.mjs`: 11.367 sistem, **uyumsuzluk yok**
- Yüksek bütçede davranış korundu: 220.000 ₺'lik örnek sistemde kasa/soğutucu
  seçimi öncekiyle birebir aynı (kalan bütçe zaten hiçbir skor artışı
  sağlamıyor, motor otomatik en kaliteli seçeneğe geçiyor)

**Kalan 5 düşüş — YENİ bir hata DEĞİL, önceden var olan ve kasıtlı bir
tasarım:** `kurDene`'de VRAM≥12GB (bütçe≥60.000) ve RAM≥32GB (bütçe≥120.000)
zorunluluğu var (kod içindeki gerekçe: "8 GB kart 60 bin ustu sistemde kotu
oneri", "16 GB RAM amiral gemisi karti bogar"). Bu eşiklerin hemen üstünde,
motor ham skoru daha yüksek ama VRAM/RAM'i yetersiz bir sistemi REDDEDİP
skoru daha düşük ama gerçekte daha sağlıklı bir sistemi seçiyor. Aynı
düşüşler değişikliklerden ÖNCEKİ kodda da birebir aynı sayıda (27 içinde,
"kasa aynı" olarak) vardı — doğrulandı, bu turda dokunulmadı. Bu, yukarıdaki
"Açık karar" (tek skor sabitinin her oyunu temsil edememesi) ile aynı kökten:
tek bir sayısal skorun gerçek dünya yeterliliğinin tamamını yakalayamaması.
Kullanıcı kararı gerekirse ayrı ele alınmalı, bu turun kapsamı dışında
tutuldu çünkü halihazırda belgelenmiş ve gerekçeli.

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
