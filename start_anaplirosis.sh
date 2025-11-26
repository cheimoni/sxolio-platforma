#!/bin/bash

echo "========================================"
echo "  Anaplirosis - Quick Start"
echo "========================================"
echo ""

cd anaplirosis

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo ""
    echo "ERROR: Node.js not found!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Node.js found!"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    echo "This may take a few minutes..."
    echo ""
    npm install
    echo ""
fi

echo "Starting React development server..."
echo ""
echo "Server will open at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
npm start


