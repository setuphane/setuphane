# Durum — 03.09.2026

Çalışmaya devam eden herkes (ve yeni bir Claude oturumu) için özet.
Kalıcı kurallar `CLAUDE.md`'nin sonundaki "SETUP HANE" bölümünde.

## Şu an ne durumdayız

| Alan | Durum |
|---|---|
| 41 parça fiyatı (Epey, 3+ satıcı kuralı) | doğrulandı, **kod ve veritabanı senkron** (03.09) |
| Masaüstü kart ve işlemci gücü (TechPowerUp) | ölçüme bağlandı |
| Çözünürlük katsayıları, kart bazlı (r1440/r2160) | ölçüme bağlandı |
| 45 laptop fiyatı + satıcı sayısı (Cimri) | doğrulandı (21.08, bu turda dokunulmadı) |
| Laptop kart gücü (NotebookCheck oyun testleri) | ölçüme bağlandı |
| 93 aksesuar ürünü, 11 kategori | canlıda (24.08: 80 yeni ürün + Mouse/Klavye eklendi, Bilek+Dekor birleşti) |
| 9 OEM hazır sistem (İncehesap) + karşılaştırma | canlıda |
| Sert kurallar | soket, watt, radyatör-kasa, PCIe x4, **kart-kasa (artık gerçekten ölçülü)**, anakart-kasa, bellek türü, VRAM, RAM, disk |
| Denetim | 11.363 kombinasyon, **uyumsuzluk yok** (03.09: kart uzunlukları eklenince 4 kombinasyon elendi) |

Veritabanı: `parcalar` 46, `laptoplar` 45, `urunler` 93 satır — kodla eşitli
(11 kalem 24.08'de REST API'den doğrulanarak güncellendi; `urunler` aynı
gün 12'den 93'e çıktı, bkz. aşağıdaki Ulugames genişletmesi).

### 03.09.2026 — Kart uzunlukları, RAM eşiği, oyun-farkında optimizer, fiyat tazeleme

**Kart uzunlukları ölçüldü — "kasaya sığar mı" kuralı artık gerçekten çalışıyor.**
10 kartın hiçbirinde `boy` yoktu; sert kural sessizce uygulanmıyordu. Yeni araç
`scripts/epey-boy.mjs`, Epey'in **"Derinlik"** alanından her kartın KENDİ ürün
sayfasından ölçüyü çeker. Değerler (mm): 7600 241 · 5060 208 · 9060xt 202 ·
5060ti 245 · 9070 288 · 5070 282 · 9070xt 290 · 5070ti 304 · 5080 304 · 5090 348.

> **Tuzak:** "Eagle OC" jetonları "Eagle **Max** OC" ilanına da uyuyor ve 281 mm
> getiriyordu; bizim modelimizin gerçek ölçüsü **208 mm**. Araç artık en sade
> adayı seçiyor ve birden fazla aday kalırsa uyarıyor. Varyant eşleşmesine dikkat.

**32 GB kuralı bütçeden karta taşındı.** Eskiden bütçe 120 bini geçince 32 GB
zorunluydu; o sınırda RAM 12.739 → 25.599 zıplayınca kart bir kademe düşüyor ve
ziyaretçinin gördüğü FPS AZALIYORDU. Kuralın gerçek gerekçesi bütçe değil kartın
kendisi. Artık `idx>=110` olan kart 32 GB istiyor. Ölçüldü:

| Seçenek | Düşüş | 120k üstü 16 GB kalan |
|---|---|---|
| bütçeye bağlı (eski) | 9 | 0/441 |
| eşik tamamen kaldırılsa | 3 | **107/441** (kötü) |
| **karta bağlı (seçilen)** | **1** | **0/441** |

Eşiği tamamen kaldırmak yanlış olurdu: 140 bin ₺'lik RTX 5080 sistemine 16 GB
düşüyordu.

**Optimizer artık seçilen oyunu ve çözünürlüğü hesaba katıyor** (`effPerf`).
Puanlamadaki sabit `min(g.idx, c.g*1.32)` ortalama bir oyun varsayıyordu; CS2
1080p'de işlemci `c.g*1.06`'da, Cyberpunk'ta `c.g*1.74`'te sınırlıyor. Sabit
katsayı yüzünden bütçe artınca motor işlemciyi düşürüp karta para aktarıyor ve
FPS düşüyordu. Artık puanladığımız şey ile gösterdiğimiz şey aynı.
`buildSystem(budget,prof,pick,game,res)` — oyun/çözünürlük **verilmezse eski
davranış korunur**, denetim araçları bozulmasın diye.

**Beraberlik bozucu:** puanca %2 içinde kalan adaylar arasından oyun FPS'i yüksek
olan seçiliyor. Optimizer %0.3-1.6'lık puan kazancı için görünür FPS'ten %7-9
feda ediyordu. Bant bilerek %2'de: genişletmek, tasarım profilini seçene kasten
daha yavaş render makinesi önermek olurdu.

Sonuç — gün sonu testi performans düşüşü **137 → 32**: oyun **0**, yayın 16,
tasarım 16 (kalanlar gerçek ödünleşme, >%2 puan farkı). Hız etkisi yok
(buildSystem 0.6 ms/çağrı).

**Fiyat tazeleme (03.09).** 15 kalem güncellendi; en büyükleri RTX 5090
263.209 → 290.409, RTX 5060 Ti 39.595 → 35.805, Ryzen 7 9700X 12.399 → 14.569.
RX 9070 (36.809) ve 650 W (2.629) doğrulandı, **değiştirilmedi**.
RTX 5090'da `boy:304` kaldırıldı (MSI Ventus ölçüsüydü), yerine Asus TUF'un
gerçek ölçüsü 348 mm kondu.

**İki denetim aracı bozuktu, düzeltildi:**

- `link-denetimi.mjs` Windows'ta `-o /dev/null` kullanıyordu; curl yazma hatası
  verip **130 linkin 130'unu da kırık** sanıyordu. Gerçek kırık link görünmezdi.
  `os.devNull`'a geçildi → gerçek sonuç: 130 link, 0 sorun.
- `fiyat-denetimi.mjs` kapasiteyi yalnızca "16 GB" yazımıyla arıyordu; gerçek
  ilanlarda kapasite ürün kodunda geçiyor (`GV-R9070GAMING OC-16GD`). Doğru
  ilanlar elenince **"RX 9070 piyasada bizden %42 pahalı"** gibi YANLIŞ alarm
  veriyordu — ona uyup fiyat yükseltmek, ziyaretçiye bulamayacağı fiyat
  göstermek olurdu. PSU kuralı da adında "Gold" arıyordu, Epey adları yazmıyor.
  Ayrıca araç artık **bizim tam modelimizin** güncel fiyatını da basıyor.
  Dikkat isteyen kalem 17 → 7.

**Şeffaflık:** oyun/çözünürlük seçimi artık sistem önerisini de değiştirdiği için
FPS modülüne tek cümlelik not eklendi.

### Açık kalanlar

- **Fiyat tazelemesi = SQL çalıştırmak.** Panelin "içeri aktar" butonu düz
  `INSERT` yapıyor ve `anahtar` benzersiz; tablo doluyken hata verir. Tazeleme
  sonrası `supabase-parcalar-guncelle.sql` Supabase SQL Editor'de çalıştırılmalı,
  yoksa **canlı fiyatlar değişmez** (veritabanı kodu ezer).
- 5 kalemin fiyatı doğrulanamadı (16 GB RAM, 3 WD SSD, hava soğutucu) — Epey
  kategorisinde 3+ satıcılı karşılıkları yok, elle bakılmalı.
- Ekran/monitör önerisi modülü geri alındı (kullanıcı isteği); çalışan mantık
  `7896eeb` commit'inde duruyor.
- Yapılmayı bekleyen: "elimde sistem var, neyi yükselteyim" akışı, ikinci el
  alım rehberi, paylaşım linkinin dinamik önizleme kartı.

### 24.08.2026 — Kategori birleştirme, yeni mouse, /öner bütçe filtresi düzeltildi

- **Bilek & Kol Destekleri + Dekor & Kişiselleştirme → "Konfor & Dekor"**
  tek kategoride birleştirildi (kullanıcı isteği: ikisi de neredeyse boştu).
  Kod yedeğindeki 5 Wraith bilek desteği ürünü de `dekor` anahtarı altına
  taşındı, canlıdaki tek `bilek` satırı `dekor`'a migrate edildi. `/öner`in
  örnek verisindeki (`ONERI_URUNLER`) ilgili satır da güncellendi.
- **Rampage'den yeni mouse eklendi**: BLITZ ULTIMATE 8K Kablosuz Oyuncu
  Mouse — Rampage de Shopify store'u, `.json` uzantısıyla temiz ürün verisi
  (isim/görsel/fiyat) veriyor.
- **`/öner` bütçe filtresi düzeltildi** — bkz. `oneriUret()` yorum bloğu.
  Kök neden: gerçek ürünler ("gercek:true") bütçeden bağımsız HER ZAMAN
  uyumlu sayılıyordu; katalog 5 üründen 93'e çıkınca filtre fiilen devre
  dışı kaldı. Çözüm: `urunler` tablosuna `mintl`/`maxtl` kolonu eklendi,
  Ulugames/Rampage'in kendi Shopify fiyat verisinden 93/93 ürüne
  dolduruldu (fiyat hiçbir yerde GÖSTERİLMİYOR, yalnızca filtrede
  kullanılıyor — "bayat fiyat" riski yok). Panel formuna opsiyonel
  "Bütçe Aralığı" alanı eklendi; boş bırakılırsa ürün eskisi gibi
  bütçeden bağımsız önerilebilir kalır (güvenli varsayılan).

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
| `node scripts/link-denetimi.mjs` | aksesuar linkleri canlı mı (kod yedeği + canlı db, 129 link, 24.08'de düzeltildi) |
| `node scripts/veri-sql.mjs > supabase-parcalar.sql` | parça SQL'i üret |
| `node scripts/laptop-sql.mjs > supabase-laptoplar-guncelle.sql` | laptop SQL'i üret |

Fiyat taramaları için: Epey `curl` ile çekilebiliyor (Node fetch 403 alıyor),
Cimri yalnızca tarayıcı içinden (sayfadaki schema.org AggregateOffer alanı).

## Geri dönüş noktaları

`git tag` → `yedek-anakart-ram-oncesi` (4c3b26e). Her önemli değişiklik ayrı
commit; `git log --oneline` ile bakıp `git revert <commit>` yeterli.
