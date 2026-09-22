/* Hazır sistemlerin "ikizi":  node scripts/oem-ikiz.mjs
   Girdi: .itopya.json (scripts/itopya-tara.mjs), .incehesap.json (tarayıcıdan —
   İncehesap Cloudflare arkasında), .epey-veri/*.json (scripts/epey-topla.mjs).
   Her OEM paket için AYNI parçaları tek tek alırsan ne ödersin:
     işlemci   — birebir aynı model
     kart      — aynı çip + aynı VRAM; önce aynı marka, yoksa herhangi marka
     RAM       — aynı toplam kapasite VE modül sayısı (16GB x1 tek modüldür)
     SSD       — aynı kapasite (sitedeki WD Blue ailesi — ucuz markalardan pahalı,
                 yani karşılaştırma hazır sistem LEHİNE temkinli)
     anakart   — aynı yonga seti (İtopya yazıyor); yazmıyorsa soketin en ucuz kartı
     güç/kasa/soğutucu — ilanda yok; sitenin SERT KURALLARIYLA seçilir (üretici
                 watt önerisi, 15 mm kasa payı, 120 W+ işlemcide tek kule yok)
   Her fiyat Epey'de EN AZ 3 SATICILI en ucuz ilan. Bir parça bile eşleşmezse o
   paket listeden çıkar — tahminle doldurulmaz (BİRİNCİ KURAL).
   Çıktı: .oem-ikiz.json + özet.                                                 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const s = readFileSync('src/setuphane.html', 'utf8');
const dizi = a => { const i = s.indexOf('const ' + a + '=['), j = s.indexOf('\n];', i);
  return new Function('Infinity', 'return ' + s.slice(i + ('const ' + a + '=').length, j + 2).replace(/\r/g, ''))(Infinity); };
const GPUS = dizi('GPUS'), CPUS = dizi('CPUS'), RAMS = dizi('RAMS'), SSDS = dizi('SSDS'),
      PSUS = dizi('PSUS'), COOLERS = dizi('COOLERS'), CASES = dizi('CASES');
/* Canlı fiyat: fiyat botunun dosyası koddakini ezer. */
const bot = existsSync('fiyatlar.json') ? JSON.parse(readFileSync('fiyatlar.json', 'utf8')).parcalar : {};
const canli = (on, x) => { const b = bot[on + ':' + x.id]; return b && b.fiyat > 0 ? b.fiyat : x.p; };
for (const [l, on] of [[RAMS, 'ram'], [SSDS, 'ssd'], [PSUS, 'psu'], [COOLERS, 'sogutucu']]) l.forEach(x => x.p = canli(on, x));
CASES.forEach((x, i) => { const b = bot['kasa:' + i]; if (b && b.fiyat > 0) x.p = b.fiyat; });

const epey = k => JSON.parse(readFileSync('.epey-veri/' + k + '.json', 'utf8'));
const EK = epey('ekran-karti'), EI = epey('islemci'), EA = epey('anakart'), ER = epey('bellek-ram');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const sayfaMetni = (() => { const onb = {}; return u => {
  if (onb[u] !== undefined) return onb[u];
  try { onb[u] = execFileSync(process.env.CURL || 'curl', ['-sS', '--compressed', '-A', UA, '--max-time', '30', u],
    { encoding: 'utf8', maxBuffer: 6e7 }).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
  catch { onb[u] = ''; }
  return onb[u]; }; })();

const sd = t => t.toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/\s+/g, ' ').trim();
const ucuz = l => l.filter(x => x.satici >= 3).sort((a, b) => a.fiyat - b.fiyat)[0] || null;

/* ── Parça çözümleme ─────────────────────────────────────────────── */
const cpuAnahtar = t => sd(t).replace(/\(.*?\)/g, '').replace(/işlemci|islemci/g, '')
  .replace(/\b(amd|intel|core)\b/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/^i(\d) (\d)/, 'i$1-$2');
const CHIPLER = [ // en uzun önce
  ['rtx 5070 ti', /rtx ?5070 ?ti\b/], ['rtx 5060 ti', /rtx ?5060 ?ti\b/], ['rx 9070 xt', /rx ?9070 ?xt\b/], ['rx 9060 xt', /rx ?9060 ?xt\b/],
  ['rtx 5090', /rtx ?5090\b/], ['rtx 5080', /rtx ?5080\b/], ['rtx 5070', /rtx ?5070\b(?! ?ti)/], ['rtx 5060', /rtx ?5060\b(?! ?ti)/],
  ['rtx 5050', /rtx ?5050\b/], ['rtx 3060', /rtx ?3060\b(?! ?ti)/], ['rx 9070', /rx ?9070\b(?! ?(xt|gre))/], ['rx 9060', /rx ?9060\b(?! ?xt)/],
];
const chipBul = t => { const x = sd(t); for (const [c, re] of CHIPLER) if (re.test(x)) return c; return null; };
/* Kodumuzdaki karta karşılık (güç kaynağı önerisi, kablo, güç — sert kurallar için) */
const KOD_GPU = { 'rtx 5060': '5060', 'rtx 5060 ti': '5060ti', 'rtx 5070': '5070', 'rtx 5070 ti': '5070ti', 'rtx 5080': '5080',
  'rtx 5090': '5090', 'rx 9060 xt': '9060xt', 'rx 9070': '9070', 'rx 9070 xt': '9070xt' };
const MARKALAR = ['asus', 'msi', 'gigabyte', 'zotac', 'colorful', 'gainward', 'powercolor', 'sapphire', 'palit', 'pny', 'xfx', 'asrock', 'inno3d'];

function kartIkiz(chip, vram, marka) {
  const tekVram = { 'rtx 5060': 8, 'rtx 5070': 12, 'rtx 5070 ti': 16, 'rtx 5080': 16, 'rtx 5090': 32, 'rx 9070': 16, 'rx 9070 xt': 16, 'rtx 5050': 8, 'rx 9060': 8 }[chip];
  const aday = EK.filter(x => chipBul(x.ad) === chip && !/pro |workstation|quadro/i.test(x.ad)).filter(x => {
    if (tekVram) return true;
    const m = sd(x.ad).match(/(\d{1,2}) ?g(b)?\b/);
    return m && +m[1] === vram;
  });
  return (marka && ucuz(aday.filter(x => sd(x.ad).startsWith(marka)))) || ucuz(aday);
}
function cpuIkiz(ad) {
  const k = cpuAnahtar(ad);
  return ucuz(EI.filter(x => cpuAnahtar(x.ad) === k));
}
const SOKET = { a620: 'AM5', b650: 'AM5', b650e: 'AM5', b840: 'AM5', b850: 'AM5', x870: 'AM5', x870e: 'AM5', x670: 'AM5', x670e: 'AM5',
  h810: 'LGA1851', b860: 'LGA1851', z890: 'LGA1851' };
function anakartIkiz(chipset, soket) {
  const l = EA.filter(x => {
    const a = sd(x.ad);
    if (chipset) return new RegExp('\\b' + chipset + '(m|i)?\\b').test(a) && !(chipset === 'b650' && /b650e/.test(a));
    return soket === 'AM5' ? /am5/.test(a) : /lga ?1851/.test(a);
  });
  return ucuz(l);
}
function ramIkiz(toplam, adet) {
  const kod = { '16x1': '16', '32x2': '32', '64x2': '64', '96x2': '96' }[toplam + 'x' + adet];
  if (kod) { const r = RAMS.find(x => x.id === kod); return r && { ad: r.n, fiyat: r.p, kod: true }; }
  // Tek modül 32 GB ya da 2×24 48 GB: Epey, kit bilgisi ürün kodundan
  const kit = a => /(k2|2k|x2|gx2|kit|2x)/i.test(a);
  const l = ER.filter(x => new RegExp(' ' + toplam + ' GB .*DDR5').test(x.ad) && !/so-?dimm|notebook/i.test(x.ad)
    && (adet === 2 ? kit(x.ad) : !kit(x.ad)));
  const e = ucuz(l); return e && { ad: e.ad, fiyat: e.fiyat };
}
function ssdIkiz(gb) {
  const g = gb >= 3500 ? 4000 : gb >= 1500 ? 2000 : gb >= 900 ? 1000 : gb >= 450 ? 500 : 0;
  const x = SSDS.find(y => y.gb === g); return x && { ad: x.n, fiyat: x.p };
}
const epeyOlcu = (link, re) => { const m = sayfaMetni(link).match(re); return m ? +m[1] : null; };

/* ── OEM okuma ──────────────────────────────────────────────────── */
function itopya(x) {
  const p = x.parca, bul = re => p.find(t => re.test(t)) || '';
  const cpu = bul(/şlemci/i).replace(/^(AMD|INTEL)-/i, '');
  const kartS = bul(/kran kart/i), marka = sd(kartS.split('-')[0]);
  const ramS = bul(/ram/i).match(/(\d+)GB \((\d+)GB x (\d+)\)/);
  const ssdS = bul(/ssd/i).match(/(\d+)(GB|TB)/i);
  const chipset = (sd(bul(/anakart/i)).match(/\b(a620|b650e|b650|b840|b850|x870e|x870|x670e|x670|h810|b860|z890|a520|b550|h610|b760)\b/) || [])[1];
  /* VRAM başlıktaki KART bölümünden: 'MSI GeForce RTX 5060 Ti 16GB'. Eski desen '16GB'da
     '6'yı yakalıyordu ve 5060 Ti ikizleri yanlış sürümle kuruluyordu. */
  const bolum = x.baslik.split('/').map(t => t.trim());
  const kartB = bolum.find(t => /rtx|rx ?\d/i.test(t)) || '';
  const vram = +((kartB.match(/\b(\d{1,2}) ?GB\b/i) || [])[1] || 0);
  /* Başlık ile parça listesi aynı sistemi mi anlatıyor? (ör. başlık 9700X + 32 GB,
     liste 9600X + 16 GB diyen ilanlar var — hangisi doğru bilinemez, elenir.) */
  const ramB = +(((bolum.find(t => /ddr[45]/i.test(t)) || '').match(/(\d+) ?GB/i) || [])[1] || 0);
  const cpuB = bolum.find(t => /ryzen|intel|core|ultra/i.test(t)) || '';
  const tutarsiz = !!((ramB && ramS && ramB !== +ramS[1]) || (cpuB && cpuAnahtar(cpuB) !== cpuAnahtar(cpu)));
  return { magaza: 'İtopya', ad: x.baslik.split(/\s*\/\s*/)[0].trim(), fiyat: x.fiyat, link: x.link, gorsel: x.gorsel,
    cpu, chip: chipBul(kartS), vram, marka: MARKALAR.includes(marka) ? marka : null,
    ramTop: ramS ? +ramS[1] : 0, ramAdet: ramS ? +ramS[3] : 0, ddr5: /ddr5/i.test(x.baslik),
    ssd: ssdS ? (ssdS[2].toUpperCase() === 'TB' ? +ssdS[1] * 1000 : +ssdS[1]) : 0, chipset, tutarsiz };
}
function incehesap([ad, fiyat, slug]) {
  const p = ad.split('|').map(t => t.trim());
  const kartS = p.find(t => /rtx|rx /i.test(t)) || '';
  const ramS = (p.find(t => /ddr5/i.test(t)) || '').match(/(?:(\d+) x )?(\d+) GB/);
  const ssdS = (p.find(t => /ssd/i.test(t)) || '').match(/(\d+) (GB|TB)/);
  const [yol, id] = slug.split('~');
  return { magaza: 'İncehesap', ad: p[0], fiyat, gorsel: null,
    link: 'https://www.incehesap.com/' + yol + (slug.includes('evo-nexus') ? '-sistem-fiyati-' : '-oem-paket-fiyati-') + id + '/',
    cpu: p[1], chip: chipBul(kartS), vram: +((kartS.match(/(\d+) GB/) || [])[1] || 0),
    marka: MARKALAR.find(m => sd(kartS).startsWith(m)) || null,
    ramTop: ramS ? (ramS[1] ? +ramS[1] * +ramS[2] : +ramS[2]) : 0, ramAdet: ramS ? (ramS[1] ? +ramS[1] : 1) : 0, ddr5: true,
    ssd: ssdS ? (ssdS[2] === 'TB' ? +ssdS[1] * 1000 : +ssdS[1]) : 0, chipset: null };
}

/* ── İkiz kurma ─────────────────────────────────────────────────── */
const KART_PAY = 15;
function ikiz(o) {
  const neden = t => ({ o, hata: t });
  if (!o.ddr5) return neden('DDR4 / ölü platform');
  if (!o.chip) return neden('ekran kartı tanınmadı');
  if (o.tutarsiz) return neden('başlık ile parça listesi çelişiyor');
  if (['rtx 5060 ti', 'rx 9060 xt'].includes(o.chip) && ![8, 16].includes(o.vram)) return neden('iki VRAM sürümü olan kartta VRAM okunamadı');
  const kodG = GPUS.find(g => g.id === KOD_GPU[o.chip]);
  if (!kodG) return neden('kart sitenin kataloğunda yok (' + o.chip + ') — güç/kablo kuralı uygulanamaz');
  const cpuE = cpuIkiz(o.cpu); if (!cpuE) return neden('işlemci 3+ satıcıyla bulunamadı: ' + o.cpu);
  const kodC = CPUS.find(c => cpuAnahtar(c.n) === cpuAnahtar(o.cpu));
  const soket = kodC ? kodC.plat : (/ryzen/i.test(o.cpu) ? 'AM5' : /ultra/i.test(o.cpu) ? 'LGA1851' : null);
  if (!soket) return neden('soket belirsiz: ' + o.cpu);
  if (o.chipset && SOKET[o.chipset] && SOKET[o.chipset] !== soket) return neden('yonga seti/soket çelişkisi');
  if (o.chipset && !SOKET[o.chipset]) return neden('yonga seti DDR5 kataloğunda yok: ' + o.chipset);
  const tdpC = kodC ? kodC.tdp : epeyOlcu(cpuE.link, /(?:Termal Tasarım Gücü|TDP)[^0-9]{0,30}(\d{2,3}) ?W/i);
  if (!tdpC) return neden('işlemci TDP bulunamadı');
  const kartE = kartIkiz(o.chip, o.vram || kodG.vram, o.marka); if (!kartE) return neden('kart 3+ satıcıyla bulunamadı');
  const boy = epeyOlcu(kartE.link, /Derinlik:? (\d{3}) ?mm/);
  const psuMin = epeyOlcu(kartE.link, /Önerilen Sistem Gücü:? (\d{3,4}) W/) || kodG.psuMin;
  const kartW = epeyOlcu(kartE.link, /Grafik Kartı Gücü:? (\d{2,3}) W/) || kodG.tdp;
  const anaE = anakartIkiz(o.chipset, soket); if (!anaE) return neden('anakart 3+ satıcıyla bulunamadı');
  const ram = ramIkiz(o.ramTop, o.ramAdet); if (!ram) return neden('RAM eşi yok: ' + o.ramTop + 'GB x' + o.ramAdet);
  const ssd = ssdIkiz(o.ssd); if (!ssd) return neden('SSD eşi yok: ' + o.ssd);
  /* Sert kurallar — sitenin motoruyla aynı */
  const g = { ...kodG, tdp: Math.max(kartW, kodG.tdp), psuMin: Math.max(psuMin || 0, kodG.psuMin || 0), boy: boy || kodG.boy };
  const psu = PSUS.filter(p => p.w >= (g.tdp + tdpC + 90) * 1.35 && p.w >= (g.psuMin || 0)
    && (!g.pin8 || p.pin8 == null || (g.p16 && p.k16 >= g.tdp) || p.pin8 >= g.pin8)).sort((a, b) => a.p - b.p)[0];
  if (!psu) return neden('uygun güç kaynağı yok');
  const kasaL = CASES.filter(k => !g.boy || !k.gpuMax || g.boy + KART_PAY <= k.gpuMax).sort((a, b) => a.p - b.p);
  let kasa = null, sog = null;
  for (const k of kasaL) {
    const cl = COOLERS.filter(c => c.cap >= tdpC * 1.15 && (tdpC < 120 || (c.sinif !== 'tek' && c.sinif !== 'stok'))
      && !(c.h && k.cpuH && c.h > k.cpuH) && (!c.rad || (k.rad && c.rad <= k.rad))).sort((a, b) => a.p - b.p)[0];
    if (cl && (!kasa || k.p + cl.p < kasa.p + sog.p)) { kasa = k; sog = cl; }
  }
  if (!kasa) return neden('uygun kasa/soğutucu yok');
  const parca = [
    ['İşlemci', cpuE.ad.replace(/\s*\(.*?\)\s*/g, ' ').trim(), cpuE.fiyat],
    ['Ekran kartı', kartE.ad.replace(/\s*\(.*?\)\s*/g, ' ').trim(), kartE.fiyat],
    ['Anakart', anaE.ad.replace(/\s*\(.*?\)\s*/g, ' ').replace(/ (AM5|LGA 1851).*$/, '').trim(), anaE.fiyat],
    ['Bellek', ram.kod ? ram.ad : ram.ad.replace(/\s*\(.*?\)\s*/g, ' ').trim(), ram.fiyat],
    ['Disk', ssd.ad, ssd.fiyat],
    ['Güç kaynağı', psu.n, psu.p],
    ['Soğutucu', sog.n, sog.p],
    ['Kasa', kasa.n, kasa.p],
  ];
  const toplam = parca.reduce((a, x) => a + x[2], 0);
  const notlar = [];
  if (o.ramAdet === 1) notlar.push('Hazır sistemde RAM tek modül (' + o.ramTop + ' GB × 1): çift kanal çalışmaz. Kendin toplarken 2 modüllü kit seçmen daha iyi olur.');
  if (!o.chipset) notlar.push('İlanda anakart modeli yazmıyor; ikizde bu soketin 3+ satıcılı en ucuz anakartı kullanıldı.');
  notlar.push('Hazır sistemde güç kaynağı, kasa ve soğutucu markası belirtilmiyor; ikizdekiler üretici önerisine göre seçildi.');
  return { o, ikiz: { toplam, parca, notlar } };
}

/* ── Çalıştır ───────────────────────────────────────────────────── */
const kaynak = [
  ...(existsSync('.itopya.json') ? JSON.parse(readFileSync('.itopya.json', 'utf8')).map(itopya) : []),
  ...(existsSync('.incehesap.json') ? JSON.parse(readFileSync('.incehesap.json', 'utf8')).map(incehesap) : []),
];
const sonuc = kaynak.map(ikiz);
const iyi = sonuc.filter(x => x.ikiz), kotu = sonuc.filter(x => x.hata);
const say = {}; kotu.forEach(x => { const k = x.hata.replace(/:.*$/, ''); say[k] = (say[k] || 0) + 1; });
console.log(`${kaynak.length} paket -> ${iyi.length} ikiz kuruldu, ${kotu.length} elendi`);
Object.entries(say).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}x ${k}`));
const fark = iyi.map(x => (x.o.fiyat - x.ikiz.toplam) / x.o.fiyat);
fark.sort((a, b) => a - b);
console.log(`Kendin toplarsan fark: medyan %${Math.round(fark[Math.floor(fark.length / 2)] * 100)}, en düşük %${Math.round(fark[0] * 100)}, en yüksek %${Math.round(fark[fark.length - 1] * 100)}`);
writeFileSync('.oem-ikiz.json', JSON.stringify(iyi.map(x => ({ ...x.o, ikiz: x.ikiz })), null, 1));
