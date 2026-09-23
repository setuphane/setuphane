/* Koddaki yedek fiyatları fiyatlar.json'dan günceller:
     node scripts/kod-fiyat-senkron.mjs [--yaz]
   Site normalde fiyatı veritabanından ya da fiyatlar.json'dan okur; koddaki
   sayılar yalnızca ikisi de okunamazsa devreye giren yedektir. Ama o yedek
   aylarca güncellenmeyince (23.09.2026: RTX 5070 Ti kodda 58.093, gerçekte
   74.835) Supabase'in kapalı olduğu bir anda ziyaretçiye yanlış fiyat
   gösterilebiliyordu. Bu betik farkı kapatır; ad değiştirmez, yalnız p: alanı. */
import { readFileSync, writeFileSync } from 'node:fs';
const YAZ = process.argv.includes('--yaz');
const kok = new URL('..', import.meta.url);
const yol = new URL('src/setuphane.html', kok);
let s = readFileSync(yol, 'utf8');
const crlf = s.includes('\r\n');
let d = s.split('\r\n').join('\n');
const fiyat = JSON.parse(readFileSync(new URL('fiyatlar.json', kok), 'utf8')).parcalar;

const dizi = (ad) => { const k = 'const ' + ad + '='; const i = d.indexOf(k), j = d.indexOf('\n];', i); return [i + k.length, j + 2]; };
const bolge = { gpu: dizi('GPUS'), cpu: dizi('CPUS'), ram: dizi('RAMS'), ssd: dizi('SSDS'),
                psu: dizi('PSUS'), sogutucu: dizi('COOLERS'), kasa: dizi('CASES'), fan: dizi('FANS') };

let degisti = 0; const rapor = [];
for (const [anahtar, v] of Object.entries(fiyat)) {
  if (!v || !(v.fiyat > 0)) continue;
  const [kat, kimlik] = anahtar.split(':');
  if (kat === 'anakart' || !bolge[kat]) continue;          // anakartlar BOARDS içinde, ayrı ele alınır
  const [bas, son] = bolge[kat];
  const parca = d.slice(bas, son);
  // kasa:N -> N'inci satır; diğerleri id:'kimlik'
  let satirBas;
  if (kat === 'kasa') {
    const satirlar = [...parca.matchAll(/\n \{n:/g)];
    if (!satirlar[+kimlik]) continue;
    satirBas = bas + satirlar[+kimlik].index + 1;
  } else {
    const m = parca.match(new RegExp("\\n \\{id:'" + kimlik.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'"));
    if (!m) continue;
    satirBas = bas + m.index + 1;
  }
  const satirSon = d.indexOf('\n', satirBas);
  const satir = d.slice(satirBas, satirSon);
  const pm = satir.match(/(\bp:)(\d+)/);
  if (!pm) continue;
  const eski = +pm[2];
  if (eski === v.fiyat) continue;
  const yeni = satir.replace(/\bp:\d+/, 'p:' + v.fiyat);
  d = d.slice(0, satirBas) + yeni + d.slice(satirSon);
  degisti++;
  rapor.push(`${anahtar.padEnd(16)} ${String(eski).padStart(7)} -> ${String(v.fiyat).padStart(7)}  (%${Math.round((v.fiyat / eski - 1) * 100)})`);
}
console.log(rapor.join('\n') || 'Fark yok.');
console.log(`\n${degisti} yedek fiyat ${YAZ ? 'güncellendi' : 'güncellenecek (yazmak için --yaz)'}.`);
if (YAZ && degisti) writeFileSync(yol, crlf ? d.split('\n').join('\r\n') : d);
