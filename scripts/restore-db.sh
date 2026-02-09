#!/bin/bash

# Try to find psql (prefer version 16 to match server)
if [ -f "/opt/homebrew/opt/postgresql@16/bin/psql" ]; then
  PSQL="/opt/homebrew/opt/postgresql@16/bin/psql"
elif [ -f "/usr/local/opt/postgresql@16/bin/psql" ]; then
  PSQL="/usr/local/opt/postgresql@16/bin/psql"
elif [ -f "/Applications/Postgres.app/Contents/Versions/latest/bin/psql" ]; then
  PSQL="/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
elif command -v psql &> /dev/null; then
  PSQL="psql"
else
  echo "❌ Error: psql not found"
  echo ""
  echo "Please install PostgreSQL client tools:"
  echo "  macOS: brew install postgresql@16"
  echo ""
  exit 1
fi

# Check if backup file argument is provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a backup file to restore"
  echo ""
  echo "Usage: npm run db:restore <backup-file>"
  echo ""
  echo "Available backups:"
  ls -1t backups/*.sql 2>/dev/null | head -5 || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file '${BACKUP_FILE}' not found"
  exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

echo "⚠️  WARNING: This will replace ALL data in your database!"
echo "📁 Restoring from: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "🔄 Restoring database..."

# Run psql to restore the backup
PGPASSWORD="${DATABASE_PASSWORD}" "${PSQL}" \
  -h "${DATABASE_HOST:-localhost}" \
  -p "${DATABASE_PORT:-5432}" \
  -U "${DATABASE_USERNAME:-postgres}" \
  -d "${DATABASE_NAME:-capacity_planner}" \
  -f "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"
  echo "🔄 Restart your Next.js server for changes to take effect"
else
  echo "❌ Restore failed!"
  exit 1
fi
