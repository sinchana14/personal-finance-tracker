@echo off
echo Stopping FinTrack servers...
echo.

:: Kill Java (backend)
taskkill /f /im java.exe 2>nul
if %errorlevel%==0 (echo [OK] Backend stopped) else (echo [--] Backend was not running)

:: Kill Node (frontend)
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (echo [OK] Frontend stopped) else (echo [--] Frontend was not running)

echo.
echo All servers stopped.
pause
