#!/bin/bash

# Installation script for Unix-like systems (macOS, Linux)

echo "========================================"
echo " Advanced Package Collection Chatbot"
echo " Installation Script"
echo "========================================"
echo ""

echo "[1/4] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "Node.js found: $(node --version)"
echo ""

echo "[2/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi
echo ""

echo "[3/4] Building TypeScript project..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi
echo ""

echo "[4/4] Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "WARNING: Some tests failed!"
    echo "You can still use the application."
fi
echo ""

echo "========================================"
echo " Installation Complete!"
echo "========================================"
echo ""
echo "To start the chatbot, run:"
echo "  npm run dev"
echo ""
echo "For help and documentation, see:"
echo "  - README.md"
echo "  - QUICKSTART.md"
echo "  - docs/USER_GUIDE.md"
echo ""
