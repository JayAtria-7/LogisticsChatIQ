@echo off
REM Installation script for Windows

echo ========================================
echo  Advanced Package Collection Chatbot
echo  Installation Script
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version
echo.

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/4] Building TypeScript project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Running tests...
call npm test
if %errorlevel% neq 0 (
    echo WARNING: Some tests failed!
    echo You can still use the application.
)
echo.

echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo To start the chatbot, run:
echo   npm run dev
echo.
echo For help and documentation, see:
echo   - README.md
echo   - QUICKSTART.md
echo   - docs/USER_GUIDE.md
echo.
pause
