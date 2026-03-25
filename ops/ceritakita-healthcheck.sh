#!/bin/bash
# CeritaKita Booking - Workspace Health Check
# Usage: ./healthcheck.sh

set -e

PROJECT_ROOT="/home/claudia/.picoclaw/workspace/ceritakita-booking"
DB_PATH="$PROJECT_ROOT/data/bookings.db"
LOG_DIR="$PROJECT_ROOT/logs"
APP_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Status tracking
STATUS="healthy"
ISSUES=()

echo "🔍 CeritaKita Booking - Health Check"
echo "===================================="
echo ""

# 1. Check if Docker container is running
echo "📦 Container Status..."
if docker ps --format '{{.Names}}' | grep -q "^ceritakita-booking$"; then
    echo -e "${GREEN}✓${NC} Container running"
else
    echo -e "${RED}✗${NC} Container not running"
    STATUS="failed"
    ISSUES+=("Container not running")
fi

# 2. Check if port is listening
echo ""
echo "🌐 Port Status..."
if ss -tlnp 2>/dev/null | grep -q ":$APP_PORT" || netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT"; then
    echo -e "${GREEN}✓${NC} Port $APP_PORT listening"
else
    echo -e "${YELLOW}⚠${NC} Port $APP_PORT not listening (may be normal if stopped)"
fi

# 3. Check health endpoint
echo ""
echo "🏥 Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Health check OK (200)"
elif [ "$HEALTH_RESPONSE" = "503" ]; then
    echo -e "${YELLOW}⚠${NC} Health check returned 503 (degraded)"
    STATUS="degraded"
    ISSUES+=("Health endpoint returned 503")
else
    echo -e "${RED}✗${NC} Health check failed ($HEALTH_RESPONSE)"
    STATUS="failed"
    ISSUES+=("Health endpoint unreachable")
fi

# 4. Check database
echo ""
echo "💾 Database..."
if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(du -h "$DB_PATH" 2>/dev/null | cut -f1)
    echo -e "${GREEN}✓${NC} Database exists ($DB_SIZE)"
    
    # Check if DB is readable
    if command -v sqlite3 &> /dev/null; then
        BOOKING_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM bookings;" 2>/dev/null || echo "0")
        echo "   Bookings: $BOOKING_COUNT"
    fi
else
    echo -e "${RED}✗${NC} Database not found"
    STATUS="failed"
    ISSUES+=("Database file missing")
fi

# 5. Check logs for errors
echo ""
echo "📋 Recent Errors (last 24h)..."
if [ -f "$LOG_DIR/error.log" ]; then
    # Get last 10 error lines from today
    TODAY=$(date +%Y-%m-%d)
    RECENT_ERRORS=$(grep "$TODAY" "$LOG_DIR/error.log" 2>/dev/null | tail -5 || echo "")
    
    if [ -n "$RECENT_ERRORS" ]; then
        echo -e "${YELLOW}⚠${NC} Found recent errors:"
        echo "$RECENT_ERRORS" | head -3 | sed 's/^/   /'
        STATUS="degraded"
        ISSUES+=("Recent errors in logs")
    else
        echo -e "${GREEN}✓${NC} No recent errors"
    fi
else
    echo -e "${YELLOW}⚠${NC} No error log found"
fi

# 6. Check disk space
echo ""
echo "💿 Disk Space..."
DISK_USAGE=$(df -h "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠${NC} Disk usage: ${DISK_USAGE}% (warning)"
    STATUS="degraded"
    ISSUES+=("Disk usage > 80%")
else
    echo -e "${RED}✗${NC} Disk usage: ${DISK_USAGE}% (critical)"
    STATUS="failed"
    ISSUES+=("Disk usage > 90%")
fi

# 7. Check memory usage
echo ""
echo "🧠 Memory (Container)..."
if docker stats --no-stream --format "{{.MemUsage}}" ceritakita-booking 2>/dev/null | grep -q "MB\|GB"; then
    MEM_USAGE=$(docker stats --no-stream --format "{{.MemUsage}}" ceritakita-booking 2>/dev/null)
    echo "   $MEM_USAGE"
fi

# Summary
echo ""
echo "===================================="
echo "📊 Summary: $STATUS"

if [ "$STATUS" = "healthy" ]; then
    echo -e "${GREEN}✓ All systems operational${NC}"
elif [ "$STATUS" = "degraded" ]; then
    echo -e "${YELLOW}⚠ Issues detected:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo "   - $issue"
    done
elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}✗ Critical issues:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo "   - $issue"
    done
fi

echo ""

# Exit with appropriate code
case $STATUS in
    healthy) exit 0 ;;
    degraded) exit 1 ;;
    failed) exit 2 ;;
esac
