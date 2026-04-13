@echo off
color 0A
echo ===================================================
echo     ERP PROJESI - OTOMATIK VERCEL GUNCELLEYICI
echo ===================================================
echo.

set /p msg="Yapmis oldugunuz degisikligin adi nedir? (Ornek: Login sayfasi yapildi): "
if "%msg%"=="" set msg=Otomatik Vercel Guncellemesi

echo.
echo [1/3] Dosyalar hazirlaniyor...
git add .

echo [2/3] Degisiklikler paketleniyor...
git commit -m "%msg%"

echo [3/3] Kodlar Github ve Vercel'e firlatiliyor...
git push origin main

echo.
echo ===================================================
echo Islem Tamamlandi! Vercel birkac saniye icinde sitenizi guncelleyecek.
echo Cikmak icin herhangi bir tusa basin...
pause >nul
