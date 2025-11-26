#!/bin/bash

echo "========================================"
echo "  School Platform - Quick Start"
echo "========================================"
echo ""

cd school-platform

# Check for Python
if command -v python3 &> /dev/null; then
    echo "Python found! Starting server..."
    echo ""
    echo "Server starting at: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Python found! Starting server..."
    echo ""
    echo "Server starting at: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
# Check for Node.js
elif command -v node &> /dev/null; then
    echo "Node.js found! Starting server..."
    echo ""
    echo "Server starting at: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx serve . -p 8000
else
    echo ""
    echo "ERROR: Neither Python nor Node.js found!"
    echo ""
    echo "Please install one of the following:"
    echo "  1. Python: https://www.python.org/downloads/"
    echo "  2. Node.js: https://nodejs.org/"
    echo ""
    echo "Or open school-platform/index.html directly in your browser"
    echo "(Note: You may have CORS issues with Firebase)"
    echo ""
    read -p "Press Enter to exit..."
fi


