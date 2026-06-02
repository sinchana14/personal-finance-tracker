@echo off
echo ============================================
echo   FinTrack - Personal Finance Tracker
echo ============================================
echo.
echo Starting Backend Server (Spring Boot)...
echo Starting Frontend Server (port 5500)...
echo.

:: Set Java path
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
set PATH=%JAVA_HOME%\bin;C:\tools\maven\apache-maven-3.9.15\bin;%PATH%

:: Start backend in a new window
start "FinTrack Backend" cmd /k "cd /d %~dp0backend && echo [Backend] Starting on http://localhost:8080 ... && C:\tools\maven\apache-maven-3.9.15\bin\mvn.cmd spring-boot:run"

:: Wait for backend to start
echo Waiting for backend to start (15 seconds)...
timeout /t 15 /nobreak >nul

:: Start frontend in a new window
start "FinTrack Frontend" cmd /k "cd /d %~dp0 && echo [Frontend] Starting on http://127.0.0.1:5500 ... && npx -y http-server ./frontend -p 5500 -c-1 --cors"

:: Wait a moment then open browser
timeout /t 5 /nobreak >nul
echo.
echo ============================================
echo   App is running!
echo   Frontend: http://127.0.0.1:5500
echo   Backend:  http://localhost:8080
echo   H2 Console: http://localhost:8080/h2-console
echo ============================================
echo.
echo Login: testuser / password123
echo Or register a new account!
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://127.0.0.1:5500
