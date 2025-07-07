#!/bin/bash

echo "🎮 Setting up Kingslayer App..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cp .env.example .env 2>/dev/null || echo ".env already exists"
cd ..

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cp .env.example .env 2>/dev/null || echo ".env already exists"
cd ..

# Install and build shared types
echo "📦 Building shared types..."
cd shared
npm install
npm run build
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"