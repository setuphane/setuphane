// Günlük fiyat botu:  node scripts/fiyat-bot.mjs [--yaz]
//
// Her parçanın SABİT Epey ürün sayfasını (scripts/epey-eslesme.json) okur,
// teklifleri tek tek sayar ve "en az 3 farklı sitede satılan modelin en ucuz
// fiyatı" kuralıyla yeni fiyatı bulur. --yaz verilmezse yalnızca raporlar.
//
// OTOMATİK OLAN YALNIZCA FİYAT. Model, ölçü, uyumluluk alanlarına dokunmaz.
// Model değişikliği bir insan kararıdır: eslesme dosyası elle güncellenir.
//
// Güvenlik frenleri (BİRİNCİ KURAL — yanlış fiyat = ziyaretçiye yanlış sistem):
//   1. 3'ten az site  -> yazılmaz, "model değişmeli" raporu.
//   2. Günlük değişim > %15 -> hemen yazılmaz. Aynı seviye (±%3) üst üste
//      3 gün görülürse gerçek piyasa hareketi sayılıp yazılır. Tek günlük
//      sapmalar böylece siteye hiç ulaşmaz.
//   3. Sıralama: aynı markanın daha güçlü kartı daha zayıfından, büyük
//      kapasite küçüğünden ucuz görünürse yazılmaz (09.09'daki 46 bin
//      liralık RTX 5080 yanlış alarmı tam olarak buydu).
//   4. Sayfa alınamazsa / yapısı değişmişse o parça atlanır, hiç yazılmaz.
//
// --yaz: sonuçları fiyatlar.json'a yazar (gizli anahtar gerekmez).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const YAZ = process.argv.includes('--yaz');
const ESLESME = JSON.parse(readFileSync(new URL('./epey-eslesme.json', import.meta.url), 'utf8'));
const DURUM_YOLU = new URL('./fiyat-durum.json', import.meta.url);
const durum = existsSync(DURUM_YOLU) ? JSON.parse(readFileSync(DURUM_YOLU, 'utf8')) : {};

const ESIK = 0.15, AYNI_SEVIYE = 0.03, ONAY_GUN = 3, MIN_SITE = 3;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const bekle = ms => new Promise(r => setTimeout(r, ms));

/* Node'un fetch'i Epey'de 403 alıyor (TLS parmak izi); curl alıyor. */
function cek(url) {
  return execFileSync(process.env.CURL || 'curl', ['-sS', '--compressed', '-A', UA, '-H', 'accept-language: tr-TR,tr;q=0.9',
    '--max-time', '40', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/* Ürün sayfasındaki her teklif bir <a class="git ..."> bloğu: site logosu +
   gizli sıralama fiyatı (kuruş). Site = logo dosya adı (n11-com, hepsiburada...). */
export function teklifleriOku(h) {
  const bas = h.indexOf('<div class="fiyatlar"');
  if (bas < 0) return null;
  const blok = h.slice(bas);
  const teklifler = [];
  for (const p of blok.split('class="git ').slice(1)) {
    const site = p.match(/resim\.epey\.com\/site\/([\w.-]+)\.(?:png|jpg|webp|svg)/);
    const fiyat = p.match(/class="urun_fiyat_sort"[^>]*>(\d+)</);
    if (site && fiyat) teklifler.push({ site: site[1], fiyat: +fiyat[1] / 100 });
  }
  return teklifler;
}

/* Bot veritabanına YAZMAZ (gizli anahtar gerekmesin diye): sonuçları sitenin
   kökündeki fiyatlar.json'a yazar, GitHub Actions dosyayı commit'ler, Vercel
   yayınlar. Site her parça için veritabanı ile bu dosyadan hangisi yeniyse
   onu kullanır. Okuma herkese açık anahtarla yapılır. */
const FIYAT_YOLU = new URL('../fiyatlar.json', import.meta.url);
const botDosya = existsSync(FIYAT_YOLU) ? JSON.parse(readFileSync(FIYAT_YOLU, 'utf8')) : { parcalar: {} };
const okuAnahtar = 'sb_publishable_skYOMRrisxDHTtnSJ-bprw_oovja6ss';
const satirlar = await (await fetch('https://qxnsdpjyxcfmhanjxtgs.supabase.co/rest/v1/parcalar?select=anahtar,ad,fiyat,idx,marka,kapasite,watt,guncelleme&aktif=eq.true',
  { headers: { apikey: okuAnahtar, Authorization: 'Bearer ' + okuAnahtar } })).json();
if (!Array.isArray(satirlar)) { console.error('Veritabanı okunamadı', satirlar); process.exit(1); }
/* Sitenin gördüğü fiyat = veritabanı ile bot dosyasından yeni olanı. */
for (const s of satirlar) {
  const b = botDosya.parcalar[s.anahtar];
  if (b && b.fiyat > 0 && !(s.guncelleme && String(s.guncelleme) >= b.tarih)) { s.fiyat = b.fiyat; s.ad = b.ad || s.ad; }
}
const db = Object.fromEntries(satirlar.map(s => [s.anahtar, s]));

/* Model adı insan kararıdır ve kodda (src/setuphane.html) kayıtlıdır. Model
   değiştirildiğinde (eslesme + kod birlikte) bot veritabanındaki adı da
   buna çeker; böylece ad ile fiyat hep aynı ürüne ait kalır. */
const kodAdlari = (() => {
  const s = readFileSync(new URL('../src/setuphane.html', import.meta.url), 'utf8');
  const dizi = a => { const i = s.indexOf('const ' + a + '=['), j = s.indexOf('\n];', i);
    return new Function('Infinity', 'return ' + s.slice(i + ('const ' + a + '=').length, j + 2).replace(/\r/g, ''))(Infinity); };
  const nesne = a => { const i = s.indexOf('const ' + a + '={'), j = s.indexOf('\n};', i);
    return new Function('return ' + s.slice(i + ('const ' + a + '=').length, j + 2).replace(/\r/g, ''))(); };
  const m = {};
  for (const [a, on] of [['GPUS', 'gpu'], ['CPUS', 'cpu'], ['RAMS', 'ram'], ['SSDS', 'ssd'], ['PSUS', 'psu'], ['COOLERS', 'sogutucu']])
    for (const x of dizi(a)) m[on + ':' + x.id] = x.n;
  const B = nesne('BOARDS');
  for (const pl of Object.keys(B)) B[pl].forEach((b, i) => { m['anakart:' + pl + '-' + i] = b.n; });
  dizi('CASES').forEach((k, i) => { m['kasa:' + i] = k.n; });
  return m;
})();

const bugun = new Date().toISOString().slice(0, 10);
const sonuc = { yazilacak: [], bekleyen: [], modelDegismeli: [], hata: [], ayni: 0 };

for (const [anahtar, link] of Object.entries(ESLESME)) {
  const eski = db[anahtar];
  if (!eski) { sonuc.hata.push(`${anahtar}: veritabanında yok`); continue; }
  let t;
  try { t = teklifleriOku(cek(link)); } catch (e) { sonuc.hata.push(`${anahtar}: sayfa alınamadı (${e.message.slice(0, 60)})`); continue; }
  await bekle(900);
  if (t === null) { sonuc.hata.push(`${anahtar}: sayfa yapısı tanınmadı — ${link}`); continue; }

  const siteler = new Set(t.map(x => x.site));
  if (siteler.size < MIN_SITE) {
    sonuc.modelDegismeli.push(`${eski.ad}: yalnızca ${siteler.size} sitede satılıyor (en az ${MIN_SITE}) — ${link}`);
    delete durum[anahtar];
    continue;
  }
  const yeni = Math.round(Math.min(...t.map(x => x.fiyat)));
  const kodAd = kodAdlari[anahtar];
  const modelDegisti = !!kodAd && kodAd !== eski.ad;
  if (yeni === eski.fiyat && !modelDegisti) { sonuc.ayni++; delete durum[anahtar]; continue; }

  /* Model bilinçli olarak değiştirildiyse eski fiyatla kıyas anlamsız:
     %15 freni yeni model için uygulanmaz (3 site kuralı yine geçerli). */
  const oran = (yeni - eski.fiyat) / eski.fiyat;
  if (!modelDegisti && Math.abs(oran) > ESIK) {
    const d = durum[anahtar];
    const ayniSeviye = d && Math.abs(yeni - d.fiyat) / d.fiyat <= AYNI_SEVIYE;
    const gun = ayniSeviye ? d.gun + (d.son === bugun ? 0 : 1) : 1;
    durum[anahtar] = { fiyat: yeni, gun, son: bugun };
    if (gun < ONAY_GUN) {
      sonuc.bekleyen.push(`${eski.ad}: ${eski.fiyat} -> ${yeni} (%${Math.round(oran * 100)}), ${gun}/${ONAY_GUN}. gün`);
      continue;
    }
  }
  delete durum[anahtar];
  sonuc.yazilacak.push({ anahtar, ad: eski.ad, yeniAd: modelDegisti ? kodAd : null, eski: eski.fiyat, yeni, site: siteler.size });
}

/* Sıralama freni: yeni fiyatlarla aynı markanın güç sırası ve kapasite sırası
   bozuluyorsa o kalemi yazma. */
const son = k => { const y = sonuc.yazilacak.find(x => x.anahtar === k); return y ? y.yeni : db[k] && db[k].fiyat; };
const sirali = (grup, olcu) => {
  const l = satirlar.filter(grup).sort((a, b) => olcu(a) - olcu(b));
  for (let i = 1; i < l.length; i++) {
    const zayif = l[i - 1], guclu = l[i];
    if (son(guclu.anahtar) < son(zayif.anahtar) * 0.9) {
      for (const k of [zayif.anahtar, guclu.anahtar]) {
        const j = sonuc.yazilacak.findIndex(x => x.anahtar === k);
        if (j >= 0) { sonuc.bekleyen.push(`${db[k].ad}: sıralama tutarsız (${guclu.ad} ${son(guclu.anahtar)} < ${zayif.ad} ${son(zayif.anahtar)}) — yazılmadı`); sonuc.yazilacak.splice(j, 1); }
      }
    }
  }
};
sirali(s => s.anahtar.startsWith('gpu:') && s.marka === 'NVIDIA', s => s.idx);
sirali(s => s.anahtar.startsWith('gpu:') && s.marka === 'AMD', s => s.idx);
sirali(s => s.anahtar.startsWith('ram:'), s => s.kapasite);
sirali(s => s.anahtar.startsWith('ssd:'), s => s.kapasite);

// ── Rapor ──
console.log(`Fiyat botu ${bugun} — ${Object.keys(ESLESME).length} parça, ${sonuc.ayni} değişmedi`);
if (sonuc.yazilacak.length) {
  console.log(`\nGÜNCELLENECEK (${sonuc.yazilacak.length}):`);
  sonuc.yazilacak.forEach(x => console.log(`  ${x.ad}: ${x.eski} -> ${x.yeni} (${x.site} site)` +
    (x.yeniAd ? `  MODEL -> ${x.yeniAd}` : '')));
}
for (const [baslik, l] of [['BEKLETİLEN (ani değişim / tutarsızlık)', sonuc.bekleyen],
  ['MODEL DEĞİŞMELİ (elle karar)', sonuc.modelDegismeli], ['HATA', sonuc.hata]])
  if (l.length) { console.log(`\n${baslik} (${l.length}):`); l.forEach(x => console.log('  ' + x)); }

if (YAZ && sonuc.yazilacak.length) {
  const tarih = new Date().toISOString();
  for (const x of sonuc.yazilacak)
    botDosya.parcalar[x.anahtar] = { fiyat: x.yeni, ad: x.yeniAd || x.ad, tarih };
  botDosya.guncelleme = tarih;
  writeFileSync(FIYAT_YOLU, JSON.stringify(botDosya, null, 1) + '\n');
  console.log(`\n${sonuc.yazilacak.length} fiyat fiyatlar.json'a yazıldı.`);
}
writeFileSync(DURUM_YOLU, JSON.stringify(durum, null, 2) + '\n');

/* İnsan müdahalesi gerekiyorsa GitHub Actions'ta rapor dosyası üretilir;
   iş akışı bunu tek bir issue olarak açar/günceller (e-posta bildirimi). */
const dikkat = [...sonuc.modelDegismeli, ...sonuc.hata];
if (process.env.RAPOR_DOSYASI)
  writeFileSync(process.env.RAPOR_DOSYASI, dikkat.length
    ? `Fiyat botu ${bugun} — elle bakılması gerekenler:\n\n` + dikkat.map(x => '- ' + x).join('\n')
      + (sonuc.bekleyen.length ? '\n\nBekletilenler (3 gün aynı kalırsa kendiliğinden yazılır):\n\n' + sonuc.bekleyen.map(x => '- ' + x).join('\n') : '')
    : '');
