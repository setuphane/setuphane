@echo off
rem Gunluk fiyat botu - Windows Gorev Zamanlayicisi bunu calistirir.
rem Epey, GitHub'in sunucularini engelliyor (21.09.2026: 44 sayfanin hepsi
rem engel sayfasi dondu); bu yuzden bot bu bilgisayarda calisiyor.
rem Akis: guncel kodu cek -> botu calistir -> fiyatlar.json'u gonder -> Vercel yayinlar.
rem Kayit: .fiyat-bot.log (son calisma), elle bakilacaklar orada "MODEL DEGISMELI" / "HATA" altinda.
cd /d C:\dev\setuphane
set CURL=C:\Program Files\Git\mingw64\bin\curl.exe
set LOG=C:\dev\setuphane\.fiyat-bot.log
echo ==== %date% %time% ==== > "%LOG%"
"C:\Program Files\Git\cmd\git.exe" pull -q --no-rebase >> "%LOG%" 2>&1
"C:\Program Files\nodejs\node.exe" scripts\fiyat-bot.mjs --yaz >> "%LOG%" 2>&1
if errorlevel 1 echo BOT HATA VERDI >> "%LOG%"
rem 24.09.2026: model izleme (3 gun kurali, yalniz rapor) - bkz. scripts\model-izle.mjs
"C:\Program Files\nodejs\node.exe" scripts\model-izle.mjs >> "%LOG%" 2>&1
if errorlevel 1 echo MODEL IZLEME HATA VERDI >> "%LOG%"
rem 24.09.2026: fiyat gecmisi (git gecmisinden gunluk seri) - bkz. scripts\fiyat-gecmis.mjs
"C:\Program Files\nodejs\node.exe" scripts\fiyat-gecmis.mjs >> "%LOG%" 2>&1
"C:\Program Files\Git\cmd\git.exe" add fiyatlar.json scripts\fiyat-durum.json scripts\model-durum.json fiyat-gecmis.json >> "%LOG%" 2>&1
"C:\Program Files\Git\cmd\git.exe" diff --cached --quiet && goto :son
"C:\Program Files\Git\cmd\git.exe" commit -q -m "fiyat-botu: gunluk fiyat guncellemesi" >> "%LOG%" 2>&1
"C:\Program Files\Git\cmd\git.exe" push -q >> "%LOG%" 2>&1
:son
echo ==== bitti %time% ==== >> "%LOG%"
rem 24.09.2026: hata ya da elle karar gerekiyorsa Windows bildirimi
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File scripts\bildirim.ps1
