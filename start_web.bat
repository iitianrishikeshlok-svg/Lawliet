@echo off
echo Starting L Desktop Assistant web server...
cd /d "%~dp0"
start "" npm run dev
timeout /t 2 /nobreak >nul
start "" http://localhost:5173/
exit
