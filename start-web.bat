@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         🚀  PACKAGE CHATBOT WEB UI LAUNCHER  📦              ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Starting web server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Build the project
echo Building TypeScript...
call npm run build
echo.

REM Start the web server
echo Starting server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev:web
