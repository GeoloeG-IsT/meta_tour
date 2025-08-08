#!/bin/bash

# SoulTrip Supabase Setup Script
echo "🚀 Setting up SoulTrip with Supabase CLI..."

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set."
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate new token'"
    echo "3. Copy the token and run:"
    echo "   export SUPABASE_ACCESS_TOKEN=your-token-here"
    echo "4. Then run this script again"
    exit 1
fi

# Check if project ref is provided
if [ -z "$1" ]; then
    echo "❌ Error: Project reference not provided."
    echo ""
    echo "Usage: ./scripts/setup-supabase.sh YOUR_PROJECT_REF"
    echo ""
    echo "You can find your project ref in your Supabase dashboard URL:"
    echo "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
    exit 1
fi

PROJECT_REF=$1

echo "📡 Linking to Supabase project: $PROJECT_REF"

# Link to the project
npx supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link to Supabase project"
    exit 1
fi

echo "📊 Pushing database migrations..."

# Push migrations
npx supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
    echo ""
    echo "🎉 Your SoulTrip database is now ready!"
    echo "You can now run 'npm run dev' and test the authentication."
else
    echo "❌ Failed to push migrations"
    echo ""
    echo "You can try running the migration manually:"
    echo "1. Go to your Supabase dashboard → SQL Editor"
    echo "2. Copy the contents of supabase/migrations/0001_initial_schema.sql"
    echo "3. Paste and run it in the SQL Editor"
    exit 1
fi