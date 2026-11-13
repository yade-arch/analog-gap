@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ANALOG GAP - cevrimdisi kopya. Tarayici aciliyor: http://127.0.0.1:4180/
where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4180/"
  node serve.mjs 4180
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4180/"
  python -m http.server 4180 --bind 127.0.0.1 --directory site
  goto :eof
)
echo Node.js (20+) ya da Python 3 gerekli. Birini kurun ve bu dosyayi yeniden calistirin. Ayrintilar: OKU-BENI.md
pause
