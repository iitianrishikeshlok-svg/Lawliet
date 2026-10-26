@echo off
title L Desktop Assistant - Local Server
cd /d "%~dp0"
echo ========================================================
echo   L-OS DETECTIVE ASSISTANT - LOCAL SERVER LAUNCHER
echo ========================================================
echo.
echo Starting Vite server on your PC (Independent of Antigravity)...
echo.
echo Desktop Local URL:   http://localhost:5173/
echo Mobile Network URL:  http://172.21.16.52:5173/
echo.
echo [NOTE] You can keep this window open or minimized.
echo Even if you close Antigravity, your server will stay alive!
echo ========================================================
echo.
npm run dev -- --host
pause
