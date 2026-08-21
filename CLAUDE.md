# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# SETUP HANE — projeye özel kurallar

## BİRİNCİ KURAL

1. **Kötü veya yanlış kombinasyon sitenin sonudur.** Birbiriyle uyumsuz
   parçalar önerilemez. Her değişiklikten sonra `scripts/kombinasyon-denetimi.mjs`
   11.611 kombinasyonda **sıfır ihlal** vermeli.
2. **Fiyat dışındaki her şey bire bir örtüşmeli.** Fiyat bizden bağımsız
   değişebilir ve bunu ziyaretçiye açıklayabiliriz; başka hiçbir veri için
   böyle bir mazeret yok.
3. **Oyun bazlı FPS değerleri hatasız çalışmalı.** Sitenin en değerli çıktısı.

**Neden:** Site hiçbir şey satmıyor, tek varlığı güvenilirlik. Yanlış fiyat
"güncellenmemiş" diye affedilir; yanlış kombinasyon veya yanlış FPS
"bu site uyduruyor" dedirtir ve o noktadan sonra fiyata da güvenilmez.

## Veri kuralları

- **Ölçümü olmayan parça listeye girmez.** Uydurma puanla ürün sergilemek,
  o ürünü hiç göstermemekten kötüdür. (RTX 5050/5060 Laptop bu yüzden çıkarıldı.)
- **Fiyat: en az 3 satıcısı olan en ucuz ilan.** Tek/iki satıcılı ilan ya
  stok dışı ya fahiş.
- **Ad ile fiyat aynı modele ait olmalı.** Parantezdeki isim, fiyatın geldiği
  modelin ta kendisi.
- **Performans değerleri ölçümden gelir:** masaüstü kart/işlemci TechPowerUp,
  laptop kartları NotebookCheck oyun testleri. Kaynak sitede yazılı.
- **Yanlış pozitife dayanarak asla veri düzeltme.** Eşleştirici hatası, hiç
  düzeltmemekten kötüdür.

## Mimari — bilinmesi şart olanlar

- `src/setuphane.html` tek kaynak; `node scripts/build.mjs` onu derleyip
  `index.html` üretir. **Doğrudan index.html düzenleme.**
- **`<head>` iki dosyada da elle tutuluyor** (src ve index). Meta değişikliği
  ikisinde de yapılmalı.
- **Metin üç yerde yaşıyor:** `<head>`, `ROTA_META` (çalışma zamanında
  document.title'ı yeniden yazar) ve bileşenin kendisi. Üçü birden
  değişmezse tutarsızlık görünmez kalır.
- **Supabase canlı kaynak, koddaki diziler yedek.** Site veritabanı çökse de
  çalışır.
- **Fiziksel/ölçüm alanları veritabanında TUTULMAZ** (`rad`, `gpuMax`,
  `form`, `x4`, `r1440`, `r2160`). Panelden boş bırakılmaları sessiz hataya
  yol açar; `koru()` yardımcısı bunları koddan taşır.

## Her değişiklikten sonra sırayla

```
node scripts/kontrol.mjs              # veri bütünlüğü
node scripts/kombinasyon-denetimi.mjs # sert uyumluluk, 11.611 kombinasyon
node scripts/gun-sonu-testi.mjs       # ziyaretçinin gördüğü tutarlılık
node scripts/build.mjs                # derle
```
Sonra **canlıda doğrula**. Kodda doğru olması yetmiyor — veritabanından
gelen veri kodu ezebiliyor.

## Tuzaklar (hepsi bizzat yaşandı)

- **Kabuk ters bölüyü yiyor.** Heredoc/`-e` içinde `\b`, `\d`, `\s` bozulur.
  Regex'li düzenlemeleri dosyaya yazıp indeks tabanlı yap, `RegExp` kur.
- **Dosyalar CRLF.** Çok satırlı birebir eşleştirme başarısız olur; `indexOf`
  ile çapa kullan.
- **`git checkout <dosya>` commit'lenmemiş işi siler.** Önce doğrula ve
  commit'le, sonra test et.
- **Babel Türkçe karakterleri kaçırır** (`SATIŞ YOK`). index.html'de
  düz metin araması yanıltıcı olur.
- **Gizli bölümde `innerText` boş döner.** Panel var mı diye bakarken
  `textContent` kullan.
- **Tarayıcı eski belgeyi önbellekten sunabilir.** Şüphelenince `fetch` ile
  sunucudan doğrula.
