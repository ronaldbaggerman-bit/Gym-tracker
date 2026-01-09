@echo off
REM Gym Tracker - Local Development Server (Windows Batch)
REM Start een lokale webserver voor Gym Tracker

setlocal enabledelayedexpansion

REM Configuratie
set "port=8000"
set "script_dir=%~dp0"

REM Banners
echo.
echo ===============================================================
echo         GYM TRACKER PRO - Local Development Server
echo ===============================================================
echo.

REM Informatie
echo [*] Server Directory: %script_dir%
echo [*] Server URL:      http://localhost:%port%
echo [*] App URL:         http://localhost:%port%/gym-tracker.html
echo.

REM PWA Info
echo [i] PWA Installation:
echo     - Desktop: Menu ^> Apps ^> Install app
echo     - Mobile: Add to home screen
echo     - App staat dan offline beschikbaar
echo.

REM Service Worker Info
echo [i] Service Worker:
echo     - Cacht alle files automatisch
echo     - Offline mode ingeschakeld
echo     - DevTools ^> Application ^> Service Workers checken
echo.

REM Instructies
echo [*] Instructies:
echo     1. Server start nu...
echo     2. Open http://localhost:%port%/gym-tracker.html in je browser
echo     3. Installeer als PWA voor offline support
echo     4. Druk Ctrl+C hier om server te stoppen
echo.

REM Check Python
echo [*] Controleer Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python niet gevonden!
    echo Install Python 3 van https://python.org
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [OK] %%i beschikbaar
)

echo.
echo [*] Server starten...
echo ===============================================================
echo.

REM Start server
python -m http.server %port% --directory "%script_dir%"

REM If we get here, server stopped
echo.
echo [*] Server gestopt.
pause
