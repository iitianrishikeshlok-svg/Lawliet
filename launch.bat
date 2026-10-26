@echo off
echo Launching "L" Desktop Assistant...
cd /d "%~dp0"
start "" npm run electron:prod
exit
