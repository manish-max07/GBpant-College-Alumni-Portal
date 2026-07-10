#!/bin/bash

echo "🚀 Setting up GBPANT Alumni Portal Backend with CAPTCHA"
echo "======================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to backend directory
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run this script from the project root."
    exit 1
fi

cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install canvas (optional, with error handling)
echo "🎨 Installing canvas for PNG CAPTCHA generation..."
npm install canvas || echo "⚠️  Canvas installation failed. SVG CAPTCHA will be used as fallback."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual configuration values."
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p temp

echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database and email credentials"
echo "2. Set up your PostgreSQL database using the schema files"
echo "3. Start the development server: npm run dev"
echo ""
echo "🔧 Available scripts:"
echo "- npm start     : Start production server"
echo "- npm run dev   : Start development server with nodemon"
echo ""
echo "🔒 CAPTCHA endpoints will be available at:"
echo "- POST http://localhost:5000/api/captcha/generate"
echo "- POST http://localhost:5000/api/captcha/verify"
echo "- GET  http://localhost:5000/api/captcha/stats"
