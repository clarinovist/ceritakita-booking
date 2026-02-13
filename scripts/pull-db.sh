#!/bin/sh
# Script to pull database from VPS (consistent snapshot)

# Default values
DEFAULT_SSH_CONN="root@173.249.28.105"
DEFAULT_DEPLOY_PATH="~/ceritakita-booking"
LOCAL_DB_PATH="./data/bookings.db"
BACKUP_PATH="./data/bookings.backup.$(date +%Y%m%d%H%M%S).db"

# Ensure data directory exists
mkdir -p ./data

echo "=== Cerita Kita Database Puller (Snapshot Mode) ==="
echo "This script creates a consistent backup on the VPS and downloads it."

# Check for --force flag
FORCE=false
if [ "$1" = "--force" ]; then
  FORCE=true
fi

# Ask for VPS connection details
if [ "$FORCE" = "true" ]; then
  SSH_CONN="${SSH_CONN:-$DEFAULT_SSH_CONN}"
  REMOTE_PATH="${REMOTE_PATH:-$DEFAULT_DEPLOY_PATH}"
else
  printf "Enter VPS SSH Connection [%s]: " "$DEFAULT_SSH_CONN"
  read SSH_CONN
  SSH_CONN="${SSH_CONN:-$DEFAULT_SSH_CONN}"

  printf "Enter Remote Deploy Path [%s]: " "$DEFAULT_DEPLOY_PATH"
  read REMOTE_PATH
  REMOTE_PATH="${REMOTE_PATH:-$DEFAULT_DEPLOY_PATH}"

  echo ""
  echo "---------------------------------------------------"
  echo "Source: ${SSH_CONN}:${REMOTE_PATH}/data/bookings.snapshot.db"
  echo "Dest  : ${LOCAL_DB_PATH}"
  echo "Backup: ${BACKUP_PATH} (if local DB exists)"
  echo "---------------------------------------------------"
  printf "Are you sure? (y/N) "
  read CONFIRM

  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted."
    exit 1
  fi
fi

# Backup local DB
if [ -f "$LOCAL_DB_PATH" ]; then
  echo "📦 Backing up local database..."
  cp "$LOCAL_DB_PATH" "$BACKUP_PATH"
else
  echo "ℹ️ No local database found, skipping backup."
fi

echo "📸 Creating consistent snapshot on VPS..."
# Execute node script inside docker container to backup sqlite db safely
ssh "$SSH_CONN" "cd $REMOTE_PATH && docker exec ceritakita-booking node -e \"const Database=require('better-sqlite3'); const db=new Database('/app/data/bookings.db'); db.backup('/app/data/bookings.snapshot.db').then(()=>console.log('Snapshot created successfully')).catch(e=>{console.error(e); process.exit(1)})\""

if [ $? -ne 0 ]; then
  echo "❌ Failed to create snapshot on VPS."
  exit 1
fi

echo "⬇️ Pulling snapshot from VPS..."
scp "${SSH_CONN}:${REMOTE_PATH}/data/bookings.snapshot.db" "$LOCAL_DB_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Database pulled successfully!"
  
  # Clean up stale WAL/SHM files locally
  rm -f "${LOCAL_DB_PATH}-wal" "${LOCAL_DB_PATH}-shm"
  
  # Optional: Clean up snapshot on remote? 
  # For now keeping it might be useful as a backup on server too, or we can delete it java.
  # ssh "$SSH_CONN" "rm ${REMOTE_PATH}/data/bookings.snapshot.db"
  
  echo "You can now run the app locally with production data."
else
  echo "❌ Failed to pull database."
  # Restore backup if pull failed and backup exists
  if [ -f "$BACKUP_PATH" ]; then
    echo "Restoring previous local database from backup..."
    mv "$BACKUP_PATH" "$LOCAL_DB_PATH"
  fi
  exit 1
fi
