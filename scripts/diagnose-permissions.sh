#!/bin/sh

# Diagnostic script for CeritaKita Booking permissions
# Run this on your production server inside or outside the container

DATA_DIR="./data"
SERVICES_FILE="./data/services.json"
LOG_DIR="./logs"

echo "--- CeritaKita Diagnostic Tool ---"
echo "Current User: $(whoami) (UID: $(id -u))"
echo "Working Directory: $(pwd)"
echo ""

check_path() {
    local path=$1
    if [ -e "$path" ]; then
        echo "[FOUND] $path"
        ls -ld "$path"
        if [ -w "$path" ]; then
            echo "  ✅ Writable"
        else
            echo "  ❌ NOT Writable"
        fi
    else
        echo "[MISSING] $path"
    fi
    echo ""
}

check_path "$DATA_DIR"
check_path "$SERVICES_FILE"
check_path "$LOG_DIR"

echo "--- Suggestion ---"
echo "If directories are not writable, try running:"
echo "sudo chown -R 1000:1000 data logs"
echo "sudo chmod -R 755 data logs"
echo "(Replace 1000 with your container's node user UID if different)"
