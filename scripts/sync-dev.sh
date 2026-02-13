#!/bin/bash
# Script to sync production database and start development server

echo "🚀 Starting Cerita Kita Development Flow..."

# Run database synchronization if possible
echo "🔄 Synchronizing production database..."
./scripts/pull-db.sh --force

if [ $? -eq 0 ]; then
  echo "✅ Database sync complete."
else
  echo "⚠️ Database sync failed (maybe SSH keys not set?). Continuing with existing local database..."
fi

# Start the dev server
echo "📡 Starting Next.js development server..."
npm run dev:original
