npm @echo off
title TT English Zone Runner
echo ========================================================
echo   KHOI DONG HE THONG QUAN LY TT ENGLISH ZONE
echo ========================================================
echo.

echo [+] Dang khoi dong Backend Server (Port: 5000)...
start "TT English Zone - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [+] Dang khoi dong Frontend Server (Vite)...
start "TT English Zone - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo --------------------------------------------------------
echo Backend va Frontend dang duoc chay trong cac cua so rieng.
echo Vui long giu cac cua so do de duy tri ung dung!
echo --------------------------------------------------------
echo.
pause
