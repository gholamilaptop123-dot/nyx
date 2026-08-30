#!/bin/sh
set -eu

echo "===================================================="
echo "Nyx Panel starting..."
echo "===================================================="

cd /app/backend

# Database migration is intentionally non-fatal so the application can
# start when the database is temporarily unavailable.
if [ -x "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --skip-generate || {
    echo "Warning: Prisma database sync failed; continuing startup." >&2
  }
fi

exec node dist/index.js
