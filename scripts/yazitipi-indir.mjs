/* Yazı tiplerini kendi sunucumuza indirir:  node scripts/yazitipi-indir.mjs
   Google Fonts'a canlı bağlanmak ilk açılışta iki ek bağlantı (DNS + TLS)
   demek ve yazılar bir an geç görünüyor. Dosyalar vendor/font altına iner,
   @font-face bloğu vendor/font/yazitipi.css olarak yazılır; index.html ve
   src/setuphane.html bu dosyayı çağırır. Türkçe karakterler latin-ext
   dilimindedir — Google'ın unicode-range blokları olduğu gibi korunuyor. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
const CURL = process.env.CURL || 'curl';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
/* Newsreader YALNIZCA vurgu kelimelerinde (.em) kullanılıyor; tam seti 238 KB
   tutuyordu. text= ile Google sadece verilen harfleri içeren bir dosya üretiyor
   (~5 KB). Türk alfabesinin tamamı + rakam ve noktalama veriliyor ki ileride
   yazılacak her vurgu kelimesi çalışsın. 23.09.2026 */
const VURGU_HARFLER = 'abcçdefgğhıijklmnoöprsştuüvyzqwxABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZQWX0123456789 .,:;!?%()-’\'"/&+';
const KAYNAK = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const KAYNAK_VURGU = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,300&display=swap&text=' + encodeURIComponent(VURGU_HARFLER);

mkdirSync('vendor/font', { recursive: true });
const cek = u => execFileSync(CURL, ['-sS', '--compressed', '-A', UA, u], { encoding: 'utf8' });
let css = cek(KAYNAK) + '\n' + cek(KAYNAK_VURGU);
const adresler = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g) || [])];
if (!adresler.length) { console.error('woff2 bulunamadı'); process.exit(1); }
let indi = 0;
for (const a of adresler) {
  const ad = a.split('/').slice(-2).join('-').replace(/[^\w.-]/g, '_');
  const hedef = 'vendor/font/' + ad;
  if (!existsSync(hedef) || statSync(hedef).size < 1000) {
    execFileSync(CURL, ['-sS', '-A', UA, '--max-time', '30', '-o', hedef, a]);
    indi++;
  }
  css = css.split(a).join('/vendor/font/' + ad);
}
writeFileSync('vendor/font/yazitipi.css', css);
const boy = adresler.reduce((t, a) => t + statSync('vendor/font/' + a.split('/').slice(-2).join('-').replace(/[^\w.-]/g, '_')).size, 0);
console.log(`${adresler.length} dosya (${indi} yeni indirildi), toplam ${Math.round(boy / 1024)} KB`);
