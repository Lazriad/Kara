#!/bin/bash

echo "🎵 Welcome to Kara - Music Compatibility Platform"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Kara project root directory"
    exit 1
fi

echo "🔍 Checking setup..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "✅ Dependencies ready!"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file with placeholder values..."
    cat > .env << EOL
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
REDIRECT_URI=http://localhost:5000/callback
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
SOUNDCLOUD_CLIENT_ID=
SOUNDCLOUD_CLIENT_SECRET=
APPLE_MUSIC_TOKEN=
YOUTUBE_API_KEY=
EOL
fi

echo ""
echo "🚀 Starting Kara development servers..."
echo "=========================================="
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start the development servers
npm run dev