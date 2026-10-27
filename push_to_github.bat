@echo off
title Push Lawliet to GitHub
cd /d "%~dp0"
echo ========================================================
echo Pushing all commits to GitHub: iitianrishikeshlok-svg/Lawliet
echo ========================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Everything has been successfully pushed to GitHub!
) else (
    echo [ERROR] Push failed. If prompted, please log into your GitHub account in the browser.
)
echo.
pause
