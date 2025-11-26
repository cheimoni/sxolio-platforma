@echo off
echo ========================================
echo   Anaplirosis - Quick Start
echo ========================================
echo.

cd anaplirosis

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js found!
    echo.
    
    if not exist "node_modules" (
        echo Installing dependencies...
        echo This may take a few minutes...
        echo.
        call npm install
        echo.
    )
    
    echo Starting React development server...
    echo.
    echo Server will open at: http://localhost:3000
    echo Press Ctrl+C to stop the server
    echo.
    call npm start
) else (
    echo.
    echo ERROR: Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
)


