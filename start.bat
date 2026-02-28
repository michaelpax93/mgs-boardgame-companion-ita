@echo off
cd /d "%~dp0"
echo ================================
echo  MGS BOARD GAME - Avvio Server
echo ================================
echo.
echo  1. Node.js  (porta 3000)
echo  2. Python   (porta 8000)
echo  3. Apri index.html direttamente (no server)
echo.
set /p scelta="Scelta [1/2/3]: "

if "%scelta%"=="1" (
    start http://localhost:3000
    npx serve .
) else if "%scelta%"=="2" (
    start http://localhost:8000
    python3 -m http.server 8000
) else if "%scelta%"=="3" (
    start "" "%~dp0index.html"
) else (
    echo Scelta non valida.
)
pause
