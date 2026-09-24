# Fiyat botunun günlük kaydını okur; elle bakılması gereken bir şey varsa
# Windows bildirimi gösterir. fiyat-bot-yerel.cmd en sonda çağırır.
# Sessiz kalırsa her şey yolunda demektir.
$log = 'C:\dev\setuphane\.fiyat-bot.log'
if (-not (Test-Path $log)) { $metin = 'Fiyat botu kaydı bulunamadı. Bot hiç çalışmamış olabilir.' }
else {
  $icerik = Get-Content $log -Raw -Encoding UTF8
  $sorunlar = @()
  if ($icerik -match 'BOT HATA VERDI|MODEL IZLEME HATA VERDI|Veritabanı okunamadı|taraması eksik') { $sorunlar += 'bot hata verdi' }
  if ($icerik -match 'MODEL DEĞİŞMELİ') { $sorunlar += 'bir parça 3 satıcının altına düştü' }
  if ($icerik -match 'MODEL DEĞİŞTİRİLEBİLİR') { $sorunlar += 'daha ucuz model 3 gündür doğrulandı' }
  if ($icerik -match 'BEKLETİLEN') { $sorunlar += 'ani fiyat değişimi bekletiliyor' }
  if ($icerik -match 'rejected|error: failed to push|fatal:') { $sorunlar += 'fiyatlar siteye gönderilemedi' }
  if ($sorunlar.Count -eq 0) { exit 0 }
  $metin = 'Bakılması gerekenler: ' + ($sorunlar -join ', ') + '. Ayrıntı: .fiyat-bot.log'
}
Add-Type -AssemblyName System.Windows.Forms
$n = New-Object System.Windows.Forms.NotifyIcon
$n.Icon = [System.Drawing.SystemIcons]::Information
$n.BalloonTipTitle = 'SETUP HANE fiyat botu'
$n.BalloonTipText = $metin
$n.Visible = $true
$n.ShowBalloonTip(15000)
Start-Sleep -Seconds 16
$n.Dispose()
