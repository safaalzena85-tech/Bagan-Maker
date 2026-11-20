@echo off
rem ============================================================
rem  Bagan Maker - Mode Stabil (hasil build, tanpa HMR)
rem  Lebih anti-blank: menyajikan folder dist/ sebagai file statis.
rem  Klik dua kali, lalu buka: http://localhost:3000
rem ============================================================
cd /d "%~dp0"
title Bagan Maker - Preview (jangan ditutup)
echo.
echo  Membangun aplikasi...
call npm.cmd run build
echo.
echo  Menyajikan hasil build di http://localhost:3000
echo  Biarkan jendela ini terbuka selama memakai aplikasi.
echo.
call npx.cmd --no-install vite preview --port 3000 --strictPort
echo.
echo  Server berhenti. Tekan tombol apa saja untuk menutup.
pause >nul
