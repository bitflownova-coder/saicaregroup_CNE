@echo off
title SAI CARE GROUP - CNE Registration System
color 0A

echo.
echo ========================================
echo   SAI CARE GROUP OF INSTITUTES
echo   CNE Registration System
echo ========================================
echo.
echo Starting MongoDB and Node.js server...
echo.

REM Check if MongoDB is running, start if needed
echo Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo Starting MongoDB service...
    net start MongoDB 2>nul
    if %errorlevel% neq 0 (
        echo Warning: MongoDB service not found or already running
    )
)

echo.
echo Starting Node.js server...
echo.

REM Start the Node.js server
start "CNE Server" cmd /k "npm start"

REM Wait 5 seconds for server to start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Opening website in browser...
echo.

REM Open the website in default browser
start http://localhost:3000

echo.
echo ========================================
echo   Website is now running!
echo ========================================
echo.
echo   Registration Form:
echo   http://localhost:3000
echo.
echo   View Registration:
echo   http://localhost:3000/view-registration
echo.
echo   Admin Panel:
echo   http://localhost:3000/admin-login
echo.
echo   Admin Credentials:
echo   Username: saicaregroupofinstitues
echo   Password: bHAGIRATH@2025?.
echo.
echo ========================================
echo.
echo Keep this window open while using the website.
echo Press any key to stop the server and close...
echo.

pause >nul

REM Stop the server (this won't execute until user presses a key)
echo.
echo Shutting down server...
taskkill /FI "WINDOWTITLE eq CNE Server*" /F >nul 2>&1

echo Server stopped.
timeout /t 2 >nul
exit
