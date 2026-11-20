@echo off
rem ============================================================
rem  Bagan Maker - Development Server (HMR / auto-reload)
rem  Klik dua kali file ini untuk menjalankan server di jendela
rem  sendiri, sehingga TIDAK ikut mati saat aplikasi lain ditutup.
rem  Buka: http://localhost:3000
rem ============================================================
cd /d "%~dp0"
title Bagan Maker - Dev Server (jangan ditutup)
echo.
echo  Dev server: http://localhost:3000
echo  Biarkan jendela ini terbuka selama memakai aplikasi.
echo.
call npm.cmd run dev
echo.
echo  Server berhenti. Tekan tombol apa saja untuk menutup.
pause >nul
