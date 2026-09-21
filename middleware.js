/* Vercel Edge Middleware — paylaşılan sistem linkleri için önizleme kartı.
   WhatsApp, X, Discord gibi platformların botları JavaScript çalıştırmaz;
   /sistem:55000-oyun-x-x-cs2-1080 linkinde de ana sayfanın genel başlığını
   görüyorlardı. Burada yalnızca o linkler için <head>'deki başlık ve açıklama
   linkteki bütçe/amaç/çözünürlükle değiştiriliyor. Diğer bütün istekler
   dokunulmadan geçer. */

const AMAC = {
  oyun: 'oyun', yayin: 'oyun + yayın', tasarim: 'video / tasarım', ofis: 'ofis ve ders',
};
const COZ = { '1080': '1080p', '1440': '1440p', '2160': '4K' };

const kacis = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default async function middleware(req) {
  /* Bir hata olursa sayfa kırılmasın: normal akışa bırak. */
  try { return await kart(req); } catch { return; }
}

async function kart(req) {
  const url = new URL(req.url);
  const m = decodeURIComponent(url.pathname).match(/^\/sistem:([\w.-]+)$/);
  if (!m) return;                                   /* dokunma, normal akış */

  const p = m[1].split('-');
  const butce = Number(p[0]);
  if (p.length !== 6 || !isFinite(butce) || butce <= 0) return;

  const tl = Math.round(butce).toLocaleString('tr-TR') + ' ₺';
  const amac = AMAC[p[1]] || 'oyun';
  const coz = COZ[p[5]] || '1080p';
  const baslik = `${tl} ${amac} bilgisayarı — SETUP HANE`;
  const aciklama = `${tl} bütçeyle kurulan ${amac} sistemi (${coz}). Parça parça liste, `
                 + `her parçanın neden seçildiği ve tahmini FPS. Satış yok, komisyon yok.`;

  const r = await fetch(new URL('/index.html', url));
  if (!r.ok) return;
  let html = await r.text();
  const koy = (re, deger) => { html = html.replace(re, deger); };
  koy(/<title>[^<]*<\/title>/, `<title>${kacis(baslik)}</title>`);
  koy(/(<meta property="og:title" content=")[^"]*/, `$1${kacis(baslik)}`);
  koy(/(<meta property="og:description" content=")[^"]*/, `$1${kacis(aciklama)}`);
  koy(/(<meta name="description" content=")[^"]*/, `$1${kacis(aciklama)}`);
  koy(/(<meta property="og:url" content=")[^"]*/, `$1${kacis(url.origin + url.pathname)}`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
