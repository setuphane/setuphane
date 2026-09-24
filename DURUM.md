# Durum — 24.09.2026

Çalışmaya devam eden herkes (ve yeni bir Claude oturumu) için özet. Önce bunu,
sonra en alttaki tarihli bölümleri oku. Tarihli bölümler eskiden yeniye değil,
KONUYA göre dağınık; bu tablo tek doğru özet.

## Şu an ne durumdayız

| Alan | Durum |
|---|---|
| PC parça fiyatları | 58 parça, Epey, **en az 3 satıcı**, her gün 10:00'da bot (PC'de Görev Zamanlayıcı). Canlı fiyat `fiyatlar.json`; kod yedek fiyatları `kod-fiyat-senkron.mjs` ile eşitleniyor |
| Model seçimi | Her yonga için 3+ satıcılı en ucuz model. **Model ancak 3 gün üst üste en ucuzsa değişir** (`model-izle.mjs`, yalnız rapor verir) |
| Performans | Ekran kartı ve işlemci TechPowerUp ölçümü (RTX 5070 = 100). Ölçümü olmayan parça eklenmez |
| Sert kurallar | soket, watt + üretici önerisi + kablo, kart-kasa (15 mm pay), soğutucu sınıfı/yüksekliği, radyatör-kasa, hava akışı (fan sayısı, **giriş ≥ egzoz**), bellek türü, form |
| Denetim | `kombinasyon-denetimi.mjs`: 13.673 kombinasyon, uyumsuzluk yok; CANLI VERİ YOLU bölümü yükleyiciyi de sınıyor |
| Sayfalar | Sistem kur, **Yükselt** (45 eski kart + 37 işlemci), Yöntem, Testler, Forum, Aksesuarlar, Öner, Hakkımızda, İş birlikleri, Gizlilik |
| Aksesuarlar / Öner | **Askıda** (24.09, kullanıcı kararı: sıfır reklam). Menüden kalktı, noindex; sayfalar markalar için iş birliği kurallarını anlatıyor (`AskidaSayfa`). Eski bileşenler (`AksesuarlarHub`, `OnerHub`) ve Supabase `urunler` silinmedi |
| Gelir | **Yok.** Sitede reklam, satış, komisyonlu bağlantı yok |
| Laptop / hazır sistem | **Kapalı** (23.09, kullanıcı kararı). Yerine "neden kapalı" açıklaması + markalar için örnek kart. Veriler silinmedi (`LaptopPickerEski`, `OemPickerEski`, Supabase `laptoplar`) |
| Tasarım | Koyu tema, Geist + Geist Mono + Newsreader italik (vurgu), yazı tipleri kendi sunucumuzda (`vendor/font`) |
| Uyarılar | Fiyat 3 günden eskiyse ziyaretçi uyarı görür. Bot sorunlarında bilgisayarda Windows bildirimi (`bildirim.ps1`) |

## Bilinmesi gereken tuzaklar

- **`index.html` elle düzenlenmez.** 24.09'dan beri derleme onu `src/setuphane.html`'den baştan üretiyor (head dahil); Tailwind ayarları da src'deki `tailwind.config`'ten okunuyor. Önceden head elle tutuluyordu ve ayrı düşmüştü.
- **Yayın kapısı:** `.githooks/pre-push` (kurulum: `git config core.hooksPath .githooks`). Kod değişen her push'ta derleme + denetim + oyun FPS testi (~70 sn); yalnız fiyat dosyası değişen bot push'larında atlanır.
- Veri üç yerde: kod (yedek + fiziksel ölçüler), Supabase `parcalar` (panel), `fiyatlar.json` (bot). Yükleyici ölçü alanlarını KODDAN korur; yeni ölçü alanı eklenince `koru` listesine ve denetimin `OLCU` listesine eklenmeli.
- Yeni ekran kartı eklenince denetimin bağımsız tablolarına da (`URETICI_PSU`, `KART_KABLO`) eklenmeli; yoksa denetim hata verir (bu bilinçli).
- Babel 500 KB üstünde compact moda geçiyordu; `build.mjs`'de `compact:false` sabit.

## Açık karar

**Motoru seçilen oyuna duyarlı hale getirmek.** Yayın profilinde 6 bütçe noktasında bütçe artınca FPS düşüyor (oyun profilinde 0). Kök neden tek denge sabiti (1.32). Kullanıcıya 24.09'da tekrar önerildi.

## Yapılacaklar (24.09.2026 analizi, sırayla)

1. ~~Forum/gizlilik metinlerindeki yanlış "sunucuya gitmez" ifadeleri~~ (24.09 yapıldı)
2. ~~Model değişikliğine 3 gün freni~~ (24.09 yapıldı)
3. ~~Bot bildirimi + fiyat eskime eşiği 3 gün~~ (24.09 yapıldı)
4. ~~DURUM.md özetini yenile~~ (24.09 yapıldı)
5. ~~Yayın öncesi otomatik test~~ (24.09 yapıldı: .githooks/pre-push)
6. ~~`index.html`'i derlemede baştan üretmek~~ (24.09 yapıldı; canlıda eski kalmış animasyon ve og etiketi düzeldi)
7. Tasarım kimliği: kullanıcı "Claude ile yapılmış sitelerden farklı, bize özgü, premium, samimi" istiyor; üç yön hazırlanıp kullanıcıya gösterilecek
8. ~~Yayın profilinde FPS düşüşü~~ (24.09: çoklu çekirdeğe tavan, donanım kodlayıcı varsayımı sitede yazıyor; yayın 15 -> 0). Tasarım profilinde 34 düşüş BİLİNÇLİ bırakıldı (render > oyun FPS)
9. ~~Fiyat geçmişi~~ (24.09: `fiyat-gecmis.mjs` + rozet; 14 günlük veri birikince, ~08.10'da görünmeye başlar)
10. ~~Alternatifler~~ (24.09: 'Aynı paraya NVIDIA mı AMD mi' karşılaştırması eklendi; işlemci karşılaştırması zaten vardı)
11. ~~Aksesuarlar / Öner~~ (24.09: örnek ürünler kaldırıldı; Öner'in bütçe filtresi ve eşleştirmesi düzeltildi)
12. Analitiğe bakmak (Vercel Analytics olayları: kasa_3b_acildi, aciklama_acildi, hizli_butce, fiyat_karsilastir, yukselt_kart, en_az_butce)
13. ~~Intel ekran kartı filtresi~~ (24.09)
14. Canlı forumdaki iki deneme yazısı ("selam selam selam", "ssssıeeoeoeo") kullanıcı tarafından panelden silinmeli

### 22.09.2026 — Kasa hava akışı (fan) kuralı

Kullanıcı: "bazı kasalarda fan var ama yetersiz". NZXT H3 Flow'da tek hazır fan
var ve ~500 W'lık sistemlerde kullanılıyordu; eski motorda 1.884 sistem yetersiz
fanlıydı. Kural: kart+işlemci ısısı <250 W: 2, 250–450: 3, >450: 4 fan; radyatör
fanları sayılır; eksik kadar Thermalright TL-C12015 (523 TL, 7 satıcı, PWM)
eklenir ve kasa seçiminde MALİYETE dahildir; fan yuvası (fanKap) yetmeyen kasa
elenir. CASES.fan/fanKap/ters (Epey). Eklenenler arka/üst egzoz, normal yönlü
(4500X'in hazır fanları zaten ters yönlü). Denetim: bağımsız 'hava-akisi' kuralı.
3D'de hazır fanlar pembe, eklenenler camgöbeği; üzerine gelince açıklama.
Sitede "3B" -> "3D"; 3D'de parçanın üzerine gelince adı ve ölçüleri.

### 22.09.2026 — Hazır sistemlerden katalog genişletme

İtopya+İncehesap 913 paketinde sık olup bizde olmayanlar tarandı. YALNIZCA
TechPowerUp ölçümü olanlar eklendi (aynı ölçeğe köprülenip mevcut değerlerle
±2 tutarlılık doğrulandı): RTX 5050 (idx 51), Core Ultra 5 250K/250KF Plus
(g101 m114), Core Ultra 7 270K Plus (g104 m132), 245KF (245K'nın grafiksiz
ikizi). EKLENMEDİ: 225F (hazır sistemlerin 1 numarası ama TPU ölçümü yok),
7500X3D, 9900X3D, RX 9060 — ölçüm bulunursa eklenecek. Anakart eklenmedi
(H810 yalnız 65 W işlemciyle anlamlı; B850/X870 değer katmıyor). LGA1700
(12700F, 14700K) bilinçli dışarıda — ölü soket. Yükleyici DB'de olmayan
kart/işlemcileri de koddan ekliyor (DBDE_YOK). Yayın/tasarım FPS düşüşü
66 -> 46, oyun 0.

### 22.09.2026 — Üst bant (200-500 bin)

Gerçek: RTX 5080 ile 5090 arasında piyasada oyun kartı YOK (Epey 100-320 bin
aralığında 3+ satıcılı tek oyun kartı ailesi 5080). Oyun sistemi 175 binde
tıkanıyor, sonraki adım ~400 bin. Bant, performans uydurmadan doldurildi:
- 4 TB NVMe (WD Blue SN5000, 7 satıcı), 96 GB 2×48 DDR5 (Crucial Pro, 5 satıcı);
  ssdS/ramS'e küçük üst puan — yalnızca artan bütçede seçilir
- `yukseltmeyeHazirla`: bütçenin ≥%10'u boştaysa güç kaynağı + kasa bir üst
  kartı da taşıyacak şekilde seçilir (sys.hazir); denetimde `yukseltmeye-hazir`
- "Kullanılmadı" mesajı üst kademenin başladığı bütçeyi söylüyor (ustKademeButce)
- Ofis profiline RAM 32 GB / disk 2 TB puan tavanı (yoksa 96 GB + 4 TB ofis PC'si)
- RTX 5080: MSI Shadow -> Gigabyte Windforce OC SFF (94k, 5 satıcı, 304 mm, 850 W)
- Yükleyici DB'de satırı olmayan kod parçalarını (RAM/SSD/soğutucu) geri ekliyor;
  denetim bunu `DBDE_YOK` ile sınıyor (eklemese 6 ölçü kaybı yakalanıyor)
- Sonuç: oyun 200k→198k, 250-350k→208k (5090'a hazır); yayın/tasarım
  250k→247k, 300-350k→269k. Oyun FPS düşüşü 0.

### 22.09.2026 — Denge kuralları: soğutucu sınıfı, kasa payı, soğutucu yüksekliği

Kullanıcı: 142 bin TL'lik 9800X3D + 5070 Ti sisteminde 1.300 TL'lik tek kule
dengesiz. İnceleyince kasa daha kötüydü: 300 mm kart 300 mm sınırlı M100A'da.
- COOLERS `sinif` (stok/tek/cift/sivi) + `h`; **120 W+ işlemcide tek kule yok**.
  Yeni: Thermalright Peerless Assassin 120 (çift kule, 157 mm, 2.714 TL, 6 satıcı;
  daha ucuz "Dual" adlılar tek kule+çift fan ya da 90 mm fan — elendi)
- **Kart ile kasa sınırı arasında en az 15 mm** (KART_PAY)
- CASES `cpuH` (M100A 160, H3 Flow 170, 4500X 185 — üretici); soğutucu yüksekliği kontrolü
- Denetimde bağımsız tablolarla `kart-kasa-pay`, `sogutucu-sinif`, `sogutucu-yukseklik`;
  eski motorda 2.524 + 254 ihlal, yenide 0
- Veritabanında satırı olmayan kod soğutucusu yükleyicide sona ekleniyor
  (fiyatı fiyatlar.json'dan); bot da DB'de olmayan kod parçasını fiyatlıyor
- RTX 5060 Ti: Zotac Twin Edge OC 2 satıcıya düştü -> Asus Dual OC 16GB
  (40.595 TL, 10 satıcı, 229 mm, üretici 550 W)
- Gün sonu: oyun FPS düşüşü 0; yayın 26 / tasarım 42 (güçlü işlemci artık çift
  kule istediği için eşiklerde bilinçli ödünleşme)

### 21.09.2026 — Güç kaynağı: üretici önerisi + kablo uyumu (2.039 sistem)

Kullanıcı bir listede fark etti: RX 9070 Gaming OC + 550 W. Motor yalnızca
"kart+işlemci+90 W ×1.35" formülüne bakıyordu; Gigabyte bu kart için
**750 W** öneriyor (resmi sayfadan doğrulandı). Eski motor **2.039 sistemde**
üretici önerisinin altında kaynak veriyordu; 36'sında RTX 5070 Ti (3×8-pin
adaptör) 2 kablolu 650 W'a verildiği için kart fiziksel olarak takılamıyordu.

- GPUS: `psuMin` (kartın kendi üreticisinin önerisi, Epey "Önerilen Sistem
  Gücü"), `pin8`, `p16`; PSUS: `pin8`, `k16` (MSI resmi teknik sayfaları)
- `psuYeter` = formül VE psuMin VE kablo; yükleyici bu alanları koruyor,
  tdp'de DB ile koddan büyük olan kullanılıyor
- Denetimde BAĞIMSIZ tablolarla `uretici-psu` ve `psu-kablo` kuralları
  (yeni kart eklenince oraya da eklenmeli, yoksa denetim hata verir)
- Sonuç: kod 11.267 / canlı veriyle tarayıcıda 3.095 sistem, ihlal 0;
  oyun profilinde FPS düşüşü 0, oyun minimumu değişmedi (52.545 ₺)

### 21.09.2026 — CANLIDA UYUMLULUK KONTROLÜ DEVRE DIŞIYDI (düzeltildi)

Site açılışta fiyatları Supabase'den alıp kod dizilerinin yerine koyuyor.
Yükleyici (`parcalariGetir`) ölçü alanlarının çoğunu **koruMUYORDU**: kartın
`boy`u, kasanın `gpuMax/formMax`ı, anakartın `form/ram/ramHiz`ı, RAM'in
`tip/hiz`ı siliniyordu. Motor "ölçü yok" deyip kuralı atladığı için canlıda
~**905 sistemde ATX anakart mATX kasaya**, ~**260 sistemde kasaya sığmayan
kart** (ör. 332 mm RTX 5070 → 300 mm M100A) öneriliyordu. Kombinasyon
denetimi kod dizileriyle çalıştığı için hep temiz geçiyordu.

Düzeltme: yükleyici tüm ölçüleri koruyor; anakart ve kasa artık ada göre
değil **anahtara göre** ('anakart:AM5-1', 'kasa:0') eşleniyor. Denetime
kalıcı **CANLI VERİ YOLU** bölümü eklendi: sitenin gerçek yükleyicisini
veritabanı satırlarının aynısıyla çalıştırıp tek bir ölçü kaybolsa bile
hata veriyor (eski kodda 37 kayıp yakalıyor). Tarayıcıda canlı veriyle
368 bütçe noktası tarandı: sorun 0. **Kural: veritabanından gelen her yeni
alan/nesne için "ölçü korunuyor mu" sorusu sorulmalı.**

### 21.09.2026 — Duyuru hazırlığı (mobil + profesyonellik)

- Hero'da 5 hızlı bütçe düğmesi (55/75/100/150/250 bin — hepsi oyun profili
  minimumunun, 52.524 ₺, üstünde; 30/45 bin ilk denemede "sistem çıkmıyor"a düşürüyordu)
- Güven satırı: fiyat tarihi · 3+ satıcı · uyumsuz parça elenir
- "Nasıl çalışır" hesabın altına; hesap bölümü telefonda 1.913 → ~990 px
- Reveal ekrana girmeden tetikleniyor (hızlı kaydırmada boş ekran kalıyordu)
- Parça listesi: her parçanın altında ölçüye dayalı gerekçe (`parcaNeden`)
  + Akakçe "Fiyat karşılaştır" linki; TOPLAM + KOPYALA/PAYLAŞ (mobil)
- Alt çubukta kapalıyken de KOPYALA; TR/EN düğmeleri kaldırıldı (çeviri yok)
- Çerez bandı ince şerit
- `middleware.js` (Vercel Edge): /sistem:… linklerinde önizleme kartı
  başlığı "75.000 ₺ oyun bilgisayarı" gibi linke özel

### 09.09.2026 — Fiyat tazeleme: 41 kalem, 10 model değişikliği

Epey'den taze veri çekildi. **Tarama derinliği tuzağı:** varsayılan sayfa
sayısıyla RAM kategorisinde 300 üründen yalnızca 1'i 16 GB'tı (en ucuz ilan
11.999 ₺) — 16 GB segmenti hiç kapsanmıyordu ve "Epey'de karşılık yok"
sanılıyordu. 30 sayfaya çıkarınca 285 adet 16 GB ilanı geldi. Anakart ve
kasa kategorilerinde de aynı sebeple derin tarama gerekti. **Kural: bir parça
"Epey'de yok" görünüyorsa önce tarama derinliğini kontrol et.**

Model değişenler (eski modelimiz ya 3 satıcının altına düştü ya da artık
sınıfın en ucuzu değildi — kullanıcı kararı: kural harfiyen uygulansın):

| Parça | Eski | Yeni | Fiyat |
|---|---|---|---|
| RX 7600 | XFX Speedster | Sapphire Pulse | 17.289 |
| RTX 5060 | Gigabyte Eagle OC | MSI Ventus 2X OC White | 19.700 |
| RTX 5060 Ti | PNY 16GB OC (listede yok) | Zotac Twin Edge OC 16GB | 35.999 |
| RTX 5070 | Gigabyte Windforce SFF | Gainward Phoenix | 41.258 |
| RX 9070 XT | ASRock Challenger | XFX Swift Triple Fan | 41.570 |
| RTX 5070 Ti | Gigabyte WindForce SFF | PNY Triple OC | 58.093 |
| RTX 5080 | Zotac Solid Core (2 satıcı) | MSI Shadow 3X OC | 83.105 |
| RTX 5090 | Asus TUF Gaming OC | MSI Ventus 3X OC | 318.181 |
| Anakart B650M | MSI B650M Gaming WiFi | Gigabyte B650M Gaming WiFi6E | 6.642 |
| PSU 1200 W | NZXT C1200 (Epey'de yok) | Zalman Watttera ZM1200-EBTII | 7.979 |

> MSI B650M Gaming WiFi'nin tek kalan ilanı **67.110 ₺** idi (saçma fiyat,
> 1 satıcı). Zalman'ın 80+ Gold olduğu ilan sayfasından doğrulandı — etiket
> "80+ Gold" dediği için varsayımla geçilmedi.

**Model değişen 8 kartın uzunluğu yeniden ölçüldü.** `epey-boy.mjs` "en sade
ad"ı seçiyor ve RTX 5060 Ti'de **8 GB** varyantının ölçüsünü getirdi; ölçüler
ürün KODU ile tekil eşleşme yapılarak (ör. `ZT-B50620H-10M`) doğrulandı.
Büyük değişimler: RTX 5070 282→332, RX 9070 XT 290→325, RTX 5090 348→325 mm.

**YANLIŞ ALARM yakalandı:** Epey'de iki Asus RTX 5080 ilanı 46.5k ₺
görünüyor — 5070 Ti'nin (58k) altında, imkânsız. Gerçek 5080 tabanı 82k+.
Araca uyup fiyatı düşürmek ziyaretçiye bulamayacağı fiyat göstermek olurdu.

**Veritabanı adımı — yöntem değişti:** `veri-sql.mjs` tabloyu `drop` edip
baştan kuruyor (production'da yıkıcı). Bunun yerine `anahtar` üzerinden
yalnızca ad+fiyat güncelleyen UPDATE üretildi; 46/46 satır REST API'den
tek tek doğrulandı.

Test: 11.303 kombinasyon **uyumsuzluk yok**; gün sonu testi **oyun
profilinde FPS düşüşü 0** (yayın 18, tasarım 28 — >%2 puan farklı gerçek
ödünleşmeler, 03.09'daki 16/16'dan fiyat hareketiyle arttı).

### 09.09.2026 — Logo hizalaması: monitör kemerle örtüşmüyordu

Kullanıcı bağımsız olarak fark etti ("kemer pc hep kaymış") — Google'da
favicon önce şüphelenildi ama favicon.svg zaten doğruydu (arch/monitör
ikisi de x=16 merkezli). Asıl sorun `NeonScene` bileşeninde (header +
hero arkaplan + tüm logo kullanımları): kemer ve masa x=150 merkezliyken
monitör x=135'teydi — 17.08.2026'da "düzeltildi" denen ama koda hiç
yansımamış eski hata.

`getBBox()` ile ölçülüp monitör +15 kaydırıldı (şimdi 150, kemer/masayla
birebir). Kasa aynı miktarda kaydırılamadı — kemerden taşmaması için
köşesi merkeze 92.7 birimden yakın kalmalı, +15 bunu 101.1'e çıkarıp
neon tüpü deliyordu; kasa yalnızca +4 kaydırıldı (91.6, sınır içinde).
Klavye/mouse kemerin açık alt ağzının altında olduğu için bu sınıra tabi
değiller, monitörle birlikte +15 kaydı.

**Not:** Bu turda uzak depoda bu oturumun bilmediği 4 commit vardı (aynı
gün başka bir oturumdan — kart uzunlukları, RAM eşiği, oyun-farkında
optimizer, fiyat tazeleme, aşağıdaki bölüm). Çakışmasız `git merge` ile
birleştirildi, tam test seti (kontrol/kombinasyon-denetimi/gün-sonu)
merge sonrası tekrar çalıştırılıp doğrulandı.

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

### (Arşiv) Açık karar — ilk not

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

### (Arşiv) Eski yapılacaklar — çoğu tamamlandı

- **"Elimde sistem var, neyi yükselteyim"** (23.09 yapıldı: /yukselt): eski kartlar (GTX 1060, RTX 3060…)
  için ölçülü performans verisi yok; uydurma idx ile FPS göstermek BİRİNCİ
  KURAL ihlali olur. Önce TechPowerUp göreli performans tablosu toplanmalı.

- **9 ekran kartının uzunluğu ölçülmedi.** Kart-kasa kuralı yalnızca
  RTX 5090'da (304 mm, TechPowerUp) uygulanabiliyor. TechPowerUp'ın arama ve
  liste uçları 410 dönüyor, Epey kart uzunluğu yayınlamıyor. Denetim bu 9
  kartı her çalıştığında raporluyor. Başka kaynak bulunmalı.
- **Alternatif öneriler (±%3).** Motor zaten bütün kombinasyonları deniyor;
  2. ve 3. en iyi sistem neredeyse bedavaya saklanabilir.
- **220 / 300 / 350 / 400 bin bandında OEM sistem yok.** İncehesap'ta o
  aralıkta paket yok. Sinerji/İtopya eklenirse dolar; tarayıcı yapısı hazır.
- **OEM listesi panelden yönetilmiyor**, şimdilik yalnızca kodda (22.09: İtopya+İncehesap, ikizli).
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

## 22.09.2026 (akşam) — Premium kasalar + giriş fanı kuralı
- Yeni kasalar (Epey teknik sayfası, 3+ satıcı): **Lian Li Lancool III** (9.999 TL, 5 satıcı; 3 ön + 1 arka 140 mm fan, kart ≤435, soğutucu ≤187) ve **Lian Li O11 Dynamic EVO RGB** (11.699 TL, 6 satıcı; FANSIZ, kart ≤455, soğutucu ≤167). kasa:4 / kasa:5 — veritabanında satırı yok, yükleyici koddan ekliyor.
- `yuva` alanı: kasanın boş fan yuvaları (varsayılan 2 ön/1 arka/3 üst). O11: alt 3 / üst 3 / yan 3 (önü cam).
- **Yeni kural `girisVar`:** her sistemde en az bir GİRİŞ fanı. O11'e üstten 360 radyatör takılınca 3 fan da dışarı üflüyordu (eski motorda 3.714 sistem). Denetime `giris` alanı + kural eklendi; eski motorla 3.714, yeniyle 0.
- Denetim: 11.282 sistem temiz, 6/6 kasa kullanılıyor. Gün sonu: oyun 0 düşüş; yayın 6 bulgu (değişiklikten önce de aynı 6).

## 22.09.2026 (gece) — Genel tarama (A'dan Z'ye)
Kontrol edilenler: 22 sayfa (başlık/canonical/kırık görsel/konsol), mobil taşma, Supabase RLS, fiyat botu (57 parçanın hepsi 3+ satıcı), OEM verisi (bugün), kombinasyon denetimi (temiz), FPS testi.
Düzeltilenler:
- PC fiyat notu ve alt bilgi "Cimri" diyordu → "Epey · en az 3 satıcı". llms.txt da güncellendi (Epey, TechPowerUp kuralı, 3D, OEM, paylaşım linkleri).
- **Laptop fiyatları 19.08'den beri güncellenmedi** (bot yalnız parçaları izliyor, Cimri 403 veriyor, Epey eşleşmesi 17/45 ve güvenilmez). Otomatik düzeltme YAPILMADI; ziyaretçiye tarih + "X gün önce" uyarısı, panelin tazelik uyarısı artık en eski tabloya bakıyor (parçada bot dosyası da sayılıyor).
- Laptop seçimi yedek listeden kalıyordu (panel eski fiyat/tarihsiz gösterebiliyordu) → veritabanı gelince güncel kayda bağlanıyor.
- psu:1200 görseli (Epey og:image kırık) → galeri görseline düşme; 200/320 px'e küçültüldü.
- Önbellek: /vendor 1 yıl (immutable), /urun 1 gün, favicon 1 hafta.
- "En az X ₺ gerekiyor" mesajına "Bu bütçeyle kur →" butonu (olay: en_az_butce).
- sitemap ana sayfa lastmod.
Açık: laptop listesinin yenilenmesi (elle, panelden) — kullanıcı kararı.

## 23.09.2026 — Hava akışı dengesi + uzun tire temizliği
- **Kullanıcı bildirimi** (sistem:197500): O11'de üstte 3 radyatör fanı dışarı üflerken tek 120'lik giriş kalıyordu. Yeni kural: **giriş fanı sayısı egzozdan az olamaz** (radyatör egzoza sayılır). fanDenge() motorda, aynı sayım bağımsız olarak denetimde. Eski davranış 6.878 sistemde dengesiz, yenisinde 0.
- Lancool III'e gerçek boş yuvalar (alt 3, üst 3) eklendi; yerleşim artık boş yuva bitince fan "uydurmuyor", kombinasyon eleniyor.
- 197.500 ₺ sistemi: O11 + 360 radyatör → 3 alt giriş fanı (3 giriş / 3 egzoz).
- **Uzun tire (—) metinlerden kaldırıldı** (kullanıcı: "hiç profesyonel bir adım değil"): 130 yer. Cümlelerde nokta/virgül/iki nokta, ayraçlarda ·, sayfa başlıklarında : ve |, boş değerlerde ·. Kodda yalnızca 3 açıklama satırında kaldı.
- Denetim temiz (11.282 sistem), gün sonu testi değişmedi (oyun 0 düşüş).

## 23.09.2026 (2) — Yazı tipi: Geist
- Space Grotesk → **Geist**, JetBrains Mono → **Geist Mono**; vurgu yazı tipi Newsreader italik korundu.
- **index.html'in <head> bölümü derlemede ÜRETİLMİYOR** (build yalnız <style id="tw"> ve <script> bloklarını gömüyor). Yazı tipi/meta değişiklikleri hem src/setuphane.html hem index.html içinde yapılmalı. Tailwind token'ları scripts/build.mjs içinde.
- Yazı tipleri kendi sunucumuzda: scripts/yazitipi-indir.mjs → vendor/font/. Google'a bağlantı yok. Newsreader yalnız vurgu harfleriyle indiriliyor (238 KB → ~6 KB). Toplam yazı tipi indirmesi 338 KB'dan **83 KB**'a düştü.
- vercel.json: woff2/js 1 yıl immutable, yazitipi.css 1 gün (adı sabit olduğu için).

## 23.09.2026 (3) — YÜKSELTME ARACI (/yukselt)
Kullanıcı isteği: "elindekini ne yapsam" aracı; eski parçalar da dahil.
- **ESKI_GPU (45 kart):** GTX 1060–RTX 4070 Super, RX 570–RX 7800 XT, Arc A750/A770. idx bizim ölçeğimizde (RTX 5070 = 100), kaynak katalogla AYNI: TechPowerUp "Relative Performance" (kart sayfasındaki RTX 5070 yüzdesi; idx = 10000/yüzde). curl'e bot doğrulaması çıkıyor, veriler gerçek tarayıcıyla okundu.
- **ESKI_CPU (37 işlemci) + KATALOG_OYUN:** Tom's Hardware 1080p oyun tablosu. Eski nesiller arşivden: 2023→güncel ×0.865 (9 ortak, 0.847–0.918), 2021→2023 ×0.657 (3 ortak, 0.640–0.660). **Bizim g ölçeğimize ÇEVRİLMEZ** (katsayı 1.23–1.45 arası oynuyor, %15 pay) — bu yüzden FPS hesabına girmez, yalnız "besler mi" sorusunda kullanılır ve karşılaştırmanın iki tarafı da aynı tablodan alınır.
- Sayfa üç yol gösterir: yalnız kart (kazanç %, VRAM, PSU watt/kablo, kasa uzunluğu), işlemci durumu (ağır oyun ve rekabetçi oyun AYRI — tek senaryo yanıltıyordu), komple yeni sistem (motorun kendisi; kart elindekinden zayıfsa açıkça uyarır).
- i5-10400F gibi ölçümü bulunamayan işlemciler listeye alınmadı; "bilmiyorum" seçeneği var.
- Derleme notu: kod 500 KB'ı aşınca Babel compact moda geçip yer tutucuları bozdu → build.mjs'e `compact:false` eklendi.

## 23.09.2026 (4) — Yöntem sayfası + "beklemede" kartları
Kullanıcı: "ziyaretçi bize güvensin ve bizi onlardan biri olarak görsün; firmalardan zengin değiliz."
- **/yontem** sayfası: dört kural (ölçülmüş performans, 3 satıcı kuralı, uymayan kombinasyon gösterilmez, gerekçe yazılır) + **gelir sınırı**: ödeme hiçbir öneriyi/sıralamayı değiştirmez; kabul edilebilir ve asla listesi. Alt menüye eklendi, sitemap + llms.txt güncellendi.
- **BeklemedeKart**: laptop ve hazır sistem bölümlerinin başında. Laptop kartı son güncelleme tarihini veriden okuyor (şu an 19 Ağustos). Eksiği gizlemek yerine ilan ediyoruz.
- İş Birlikleri sayfasına sınır cümlesi ve /yontem bağlantısı eklendi.
Not: Laptop verisini tazeleme kararı kullanıcıya bırakıldı; bu kartlar o güne kadar doğru bilgi veriyor.

## 23.09.2026 (5) — Laptop ve hazır sistem listeleri kaldırıldı
Kullanıcı kararı: iki bölümdeki gerçek ürünler ziyaretçiye gösterilmeyecek; yerine ÖRNEK ALAN.
- `OemPicker` ve `LaptopPicker` artık `BosBolum` döndürüyor. Eski liste bileşenleri `OemPickerEski` / `LaptopPickerEski` olarak duruyor (veri geri açılınca kullanılacak); Supabase'deki laptop satırları ve OEM verisi SİLİNMEDİ.
- BosBolum: neden kapalı olduğunu sade dille anlatır + markalar için "ürün burada böyle görünecek" örnek kartı (üstünde GERÇEK ÜRÜN DEĞİL yazar).
- /yontem metinleri sadeleştirildi (kullanıcı: "yapay zeka dilinden uzaklaş"). "Gelir öneri motorunun dışından gelir" gibi anlaşılmayan cümleler yerine: "Bu siteden para kazanıyor muyuz? Şu an hayır... Bize para veren marka, sistem önerilerinde daha yukarı çıkamaz."

## 23.09.2026 (6) — Genel tarama + veri düzeltmeleri
- **Model değişiklikleri (3 satıcı kuralı):** RTX 5080 Windforce SFF tek satıcıya düşmüştü → **Palit GamingPro** (85.100, 4 satıcı, 332 mm). Ayrıca kural gereği daha ucuz olanlara geçildi: RTX 5050 → Asus Dual OC (18.999), RTX 5060 → MSI Shadow 2X OC Max (22.900), RTX 5070 → MSI Ventus 3X OC (47.781), RTX 5070 Ti → Gigabyte Windforce OC V2 (69.999). Hepsinin ölçüsü Epey teknik sayfasından alındı; görseller ve epey-eslesme güncellendi; bot --yaz ile fiyat/ad senkronlandı.
- **Yeni kart: Intel Arc B580 12 GB** (18.199, 4 satıcı). idx 55 (TechPowerUp: RTX 5070'in %183'ü). 55-90 bin bandında seçiliyor. r1440/r2160 ölçümü olmadığı için yazılmadı (1.00 sayılır). Denetim tablolarına (URETICI_PSU 450 W, KART_KABLO 1x8pin) eklendi.
- **scripts/kod-fiyat-senkron.mjs**: koddaki yedek fiyatları fiyatlar.json'dan günceller. 36 fiyat güncellendi (RTX 5070 Ti kodda 58.093 iken gerçekte 74.835'ti; yedek yalnız Supabase+json okunamazsa devreye giriyor ama yine de yanlıştı).
- Hata bildiriminde /_vercel/ kaynaklı hatalar artık kaydedilmiyor (yerelde analitik betiği yok, canlı hata tablosunu kirletiyordu).
- Önceki nesil kartlar (RX 7800 XT, RTX 4070 Super, RX 7700 XT...) Türkiye'de 3+ satıcıda bulunamadı: kural gereği eklenmedi.
- Kontroller: 13.673 kombinasyon temiz, oyun profilinde FPS düşüşü 0, 22 sayfada konsol hatası ve kırık görsel yok, 57 parçanın hepsinin görseli var.


## 24.09.2026 — Opus 5.5 analizi ve uygulaması
Kullanıcı projeyi baştan analiz ettirdi, tasarım dışında her şeyi uygulattı (tasarım: "eski haliyle kalsın").
- **Komisyon tutarsızlığı (önemli):** Aksesuarlar'daki 93 üründen 91'i Ulugames komisyonlu bağlantısı (bg_ref), ama site 8 yerde "komisyon almıyoruz" diyordu. Metinler gerçeğe uyduruldu: sistem önerileri komisyonsuz; aksesuar sayfasında görünür açıklama + her karta "İş birliği bağlantısı". Bağlantıları tutma/kaldırma KARARI kullanıcıda.
- Forum/gizlilik metinlerinde "sunucuya gitmez" yanlışları düzeltildi; gizlilik sayfasına hata kayıtları eklendi.
- Model freni (`model-izle.mjs`, 3 gün), bot bildirimi (`bildirim.ps1`), fiyat eskime eşiği 3 gün.
- Yayın kapısı (`.githooks/pre-push`), index.html tamamen src'den üretiliyor (canlıda eski animasyon kalmıştı).
- FPS testi yalnız ilk 6 düşüşü sayıyordu; gerçek sayı 49'du. Yayın profili düzeltildi (49 -> 34, hepsi tasarım).
- Logo yazısı: iç çizgiler (paint-order) ve küçük boyutta taşma (26 px altı dolu renk).
- Öner: örnek ürünler kaldırıldı, bütçe filtresi ters çalışıyordu (düzeltildi), en uzun eşleşme kazanır.
- Kullanıcıdan beklenen: forumdaki 2 deneme yazısını silmek; Vercel Analytics'e erişim (olaylara bakmak için).

### 24.09.2026 (akşam) — Aksesuarlar ve Öner askıya alındı
Kullanıcı: "öneri ve aksesuarlar kısmını da askıya alalım, sıfır reklama indirelim; oralarda iş birliklerine özgü bilgiler paylaşabiliriz."
- Menüden kalktı; /aksesuarlar ve /oner `AskidaSayfa` gösteriyor (neden kapalı + markalar için 4 kural: önce test, her zaman etiketli, sıralama satılmaz, bilgisayar önerisi ayrı kalır). noindex, sitemap'ten çıktı.
- Ana sayfadaki "Bunları da dene" kartları: Yükselt, Yöntem, Testler, Forum.
- "Komisyon almıyoruz" artık her yerde doğru; Yöntem'deki gelir bölümü "Hayır" diye yeniden yazıldı. 9 sayfada komisyonlu bağlantı sayısı 0 (tarayıcıda doğrulandı).

### 24.09.2026 (gece) — Yükselt sayfası yeniden yazıldı
Kullanıcı: "yükselt kısmı çok zayıf; RAM vs seçimlerle performans puanlaması, dolu ve kullanışlı olsun".
- Girdiler: kart, işlemci, RAM (miktar + DDR4/DDR5), güç kaynağı (W), disk (HDD/SATA/NVMe), ekran çözünürlüğü, bütçe.
- 5 bölüm: sistem karnesi (6 kart), önce ne yapmalı (sıralı, fiyatlı plan; zorunlu olan önce), kart seçenekleri tablosu (kazanç, maliyet, 10 bin TL başına kazanç, güç kaynağı yeter mi; yetmezse PSU fiyata eklenir), komple sistem.
- Uydurma sayı yok: kart puanı TechPowerUp; RAM/güç/görüntü belleği kuralları motorla aynı; fiyatlar katalogdan.
- **cpuBant düzeltildi:** eski yöntem Ryzen 5 7600'dan zayıf her işlemciye "bekletir" diyordu (katalogdaki en zayıf referans o). Yeni yöntem sitenin FPS modelini kullanıyor: gereken g = idx·resKat·k·mul/ck; eski işlemcinin g'si 7600'a oranla tahmin (±%15), sonuç üç bant.
- Varsayılan öneri: işlemcinin ağır oyunda RAHAT beslediği en güçlü kart (3600 -> RTX 5060 Ti; 13600K -> RX 9070 XT + 850 W + 32 GB). Daha güçlüsü "İŞLEMCİN SINIRDA" etiketiyle.
