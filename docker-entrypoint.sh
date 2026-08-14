#!/bin/sh
set -e

echo "===================================================="
echo "🚀 [Nyx Panel] Starting in Cloud Container (PaaS)..."
echo "===================================================="

# Auto-migrate database schema on startup
cd /app/backend
npx prisma db push --skip-generate || true

# Start Node.js API + Xray manager + Web UI
exec node dist/index.js
