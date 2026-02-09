#!/bin/bash

# Try to find pg_dump (prefer version 16 to match server)
if [ -f "/opt/homebrew/opt/postgresql@16/bin/pg_dump" ]; then
  PG_DUMP="/opt/homebrew/opt/postgresql@16/bin/pg_dump"
elif [ -f "/usr/local/opt/postgresql@16/bin/pg_dump" ]; then
  PG_DUMP="/usr/local/opt/postgresql@16/bin/pg_dump"
elif [ -f "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump" ]; then
  PG_DUMP="/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump"
elif command -v pg_dump &> /dev/null; then
  PG_DUMP="pg_dump"
else
  echo "❌ Error: pg_dump not found"
  echo ""
  echo "Please install PostgreSQL client tools:"
  echo "  macOS: brew install postgresql@16"
  echo ""
  exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/capacity_db_backup_${TIMESTAMP}.sql"

echo "🔄 Backing up database to ${BACKUP_FILE}..."

# Run pg_dump with connection details from env
PGPASSWORD="${DATABASE_PASSWORD}" "${PG_DUMP}" \
  -h "${DATABASE_HOST:-localhost}" \
  -p "${DATABASE_PORT:-5432}" \
  -U "${DATABASE_USERNAME:-postgres}" \
  -d "${DATABASE_NAME:-capacity_planner}" \
  --clean \
  --if-exists \
  -f "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully!"
  echo "📁 Backup saved to: ${BACKUP_FILE}"
  echo ""
  echo "💡 To restore this backup later, run:"
  echo "   npm run db:restore backups/capacity_db_backup_${TIMESTAMP}.sql"
else
  echo "❌ Backup failed!"
  exit 1
fi
