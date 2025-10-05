#!/bin/bash

# NASA Weather Explorer Deployment Script
echo "🛰️ NASA Weather Explorer - Deployment Script"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your Supabase credentials"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if supabase is linked
if [ ! -f .supabase/config.toml ]; then
    echo "🔗 Please link your Supabase project:"
    echo "supabase link --project-ref your-project-ref"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Push database migrations
echo "🗄️ Pushing database migrations..."
supabase db push

# Deploy edge functions
echo "⚡ Deploying edge functions..."
supabase functions deploy get-nasa-weather

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy the 'dist' folder to your hosting service (Vercel, Netlify, etc.)"
echo "2. Make sure your domain is added to Supabase allowed origins"
echo "3. Test the application with a few locations"
echo ""
echo "🚀 Your NASA Weather Explorer is ready to launch!"