// src/setuphane.html -> index.html
// JSX kaynağını Babel ile React.createElement'e çevirir, Tailwind CLI ile
// kullanılan sınıflardan CSS üretir, ikisini index.html'in derlenmiş
// <style id="tw"> ve <script> bloklarına gömer. README'deki "yeniden derle"
// adımı budur: `node scripts/build.mjs`.
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

// 2) Tailwind CSS: kullanılan sınıfları src/setuphane.html içeriğinden tarar.
const tmp = await mkdtemp(path.join(tmpdir(), 'sh-tw-'));
const twConfig = `
module.exports = {
  content: [${JSON.stringify(srcPath)}],
  theme: { extend: {
    colors: { bg:'#07070B', bg2:'#0E0E15', ink:'#ECEBF2', dim:'#8B88A0',
              cy:'#2DE2E6', mg:'#FF2D95', line:'rgba(236,235,242,.10)' },
    fontFamily: {
      display:['"Space Grotesk"','system-ui','sans-serif'],
      serif:['Newsreader','Georgia','serif'],
      mono:['"JetBrains Mono"','ui-monospace','monospace']
    }
  } }
};`;
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

// 3) index.html'e göm.
let out = await readFile(outPath, 'utf8');
out = out.replace(
  /<style id="tw">[\s\S]*?<\/style>/,
  `<style id="tw">\n${twCss}\n</style>`
);
out = out.replace(
  /(<script>\r?\n)[\s\S]*?(\r?\n<\/script>\r?\n<\/body>)/,
  (_, a, b) => `${a}${code}${b}`
);
await writeFile(outPath, out);
console.log('index.html güncellendi.');
