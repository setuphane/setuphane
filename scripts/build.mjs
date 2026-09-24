// src/setuphane.html -> index.html
// JSX kaynağını Babel ile React.createElement'e çevirir, Tailwind CLI ile
// kullanılan sınıflardan CSS üretir ve index.html'i src'den BAŞTAN üretir
// (24.09.2026'dan beri <head> dahil; index.html elle düzenlenmez).
// README'deki "yeniden derle" adımı budur: `node scripts/build.mjs`.
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import babel from '@babel/core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'src/setuphane.html');
const outPath = path.join(root, 'index.html');

// Veri butunlugu once: bozuk bir veriyle derleyip yayina cikarmaktansa
// burada durmak iyi. Ayrintili gerekce icin scripts/kontrol.mjs.
execFileSync(process.execPath, [path.join(root, 'scripts/kontrol.mjs')], { stdio: 'inherit' });

const src = await readFile(srcPath, 'utf8');

// 1) JSX <script> bloğunu çıkar ve Babel ile derle.
const jsxMatch = src.match(/<script type="text\/babel" data-presets="react">\r?\n([\s\S]*?)\r?\n<\/script>/);
if (!jsxMatch) throw new Error('JSX <script> bloğu bulunamadı');
const { code: babelKod } = babel.transform(jsxMatch[1], {
  presets: [['@babel/preset-react', { development: false }]],
  babelrc: false, configFile: false,
  /* 23.09.2026: kod 500 KB'i asinca Babel kendiliginden "compact" moda geciyor
     ve 'const X = {};' -> 'const X={};' oluyordu; yer tutucu aramasi kiriliyordu.
     Bicimi sabitliyoruz ki derleme cikti buyudukce bozulmasin. */
  compact: false, generatorOpts: { compact: false },
});

// 1b) "Fiyat karşılaştır" linkleri: parça -> birebir Epey ürün sayfası.
//     Fiyat botunun kullandığı eşlemeyle AYNI dosya; tek kaynak.
const epeyLink = JSON.parse(await readFile(path.join(root, 'scripts/epey-eslesme.json'), 'utf8'));
const epeyYer = 'const EPEY_LINK = {};';
if (!babelKod.includes(epeyYer)) throw new Error('EPEY_LINK yer tutucusu derlenmiş kodda bulunamadı');
let code = babelKod.replace(epeyYer, 'const EPEY_LINK = ' + JSON.stringify(epeyLink) + ';');
// 1c) Parçaların gerçek ürün görselleri (scripts/parca-gorsel.mjs -> urun/parca/).
//     Hangi parçanın görseli varsa listesi gömülür; yoksa çizim ikon kalır.
const { readdirSync, existsSync } = await import('node:fs');
const gorselDizin = path.join(root, 'urun/parca');
const gorseller = existsSync(gorselDizin) ? readdirSync(gorselDizin).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)) : [];
const gorselYer = 'const PARCA_GORSEL = [];';
if (!code.includes(gorselYer)) throw new Error('PARCA_GORSEL yer tutucusu derlenmiş kodda bulunamadı');
code = code.replace(gorselYer, 'const PARCA_GORSEL = ' + JSON.stringify(gorseller) + ';');
const dizin3b = path.join(root, 'urun/parca/3b');
const gorsel3b = existsSync(dizin3b) ? readdirSync(dizin3b).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)) : [];
if (!code.includes('const PARCA_GORSEL3B = [];')) throw new Error('PARCA_GORSEL3B yer tutucusu bulunamadı');
code = code.replace('const PARCA_GORSEL3B = [];', 'const PARCA_GORSEL3B = ' + JSON.stringify(gorsel3b) + ';');

// 2) Tailwind CSS: kullanılan sınıfları src/setuphane.html içeriğinden tarar.
//    24.09.2026: renk ve yazı tipi ayarları src'deki tailwind.config'ten okunur.
//    Önceden burada bir kopyası vardı; ikisi ayrı düşebiliyordu.
const twAyar = src.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\n\})\s*\r?\n<\/script>/);
if (!twAyar) throw new Error('src içinde tailwind.config bulunamadı');
const tmp = await mkdtemp(path.join(tmpdir(), 'sh-tw-'));
const twConfig = `module.exports = Object.assign(${twAyar[1]}, { content: [${JSON.stringify(srcPath)}] });`;
const twInput = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
const configPath = path.join(tmp, 'tailwind.config.cjs');
const inputPath = path.join(tmp, 'in.css');
const outCssPath = path.join(tmp, 'out.css');
await writeFile(configPath, twConfig);
await writeFile(inputPath, twInput);
const twCli = path.join(root, 'node_modules/tailwindcss/lib/cli.js');
execFileSync(process.execPath, [twCli, '-c', configPath, '-i', inputPath, '-o', outCssPath, '--minify'], { stdio: 'inherit' });
const twCss = (await readFile(outCssPath, 'utf8')).trim();
await rm(tmp, { recursive: true, force: true });

// 3) index.html'i src'den BAŞTAN üret (24.09.2026).
//    Önceden yalnızca iki blok gömülüyordu; <head> elle tutuluyordu ve src ile
//    ayrı düşüyordu (canlıda eski kayma animasyonu ve eski og:image:alt kalmıştı).
//    Yapılanlar: geliştirme için Tailwind CDN'i ve ayar bloğu çıkarılır, yerine
//    derlenmiş CSS; tarayıcıda JSX çeviren Babel çıkarılır, yerine derlenmiş kod.
const cikar = (metin, desen, ad) => {
  if (!desen.test(metin)) throw new Error(ad + ' src içinde bulunamadı; derleme durduruldu');
  return metin.replace(desen, '');
};
let out = src.replace(/^﻿/, '');
out = cikar(out, /[ \t]*<link rel="preconnect" href="https:\/\/cdn\.tailwindcss\.com"[^>]*>\r?\n/, 'Tailwind preconnect');
out = cikar(out, /[ \t]*<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>\r?\n/, 'Tailwind CDN');
out = cikar(out, /[ \t]*<script>\r?\ntailwind\.config\s*=[\s\S]*?\n<\/script>\r?\n/, 'Tailwind ayar bloğu');
out = cikar(out, /[ \t]*<script src="https:\/\/unpkg\.com\/@babel\/standalone[^"]*"><\/script>\r?\n/, 'Babel standalone');
const ilkStilSonu = out.indexOf('</style>');
if (ilkStilSonu < 0) throw new Error('ana <style> bloğu bulunamadı');
out = out.slice(0, ilkStilSonu + 8) + '\n<style id="tw">\n' + twCss + '\n</style>' + out.slice(ilkStilSonu + 8);
const jsx = /<script type="text\/babel" data-presets="react">\r?\n[\s\S]*?\r?\n<\/script>/;
if (!jsx.test(out)) throw new Error('JSX bloğu çıktıda bulunamadı');
out = out.replace(jsx, () => '<script>\n' + code + '\n</script>');
for (const yasak of ['cdn.tailwindcss.com', 'babel/standalone', 'text/babel'])
  if (out.includes(yasak)) throw new Error('çıktıda geliştirme kalıntısı var: ' + yasak);
await writeFile(outPath, out);
console.log("index.html güncellendi (src'den baştan üretildi).");
