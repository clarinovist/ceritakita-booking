#!/bin/bash
# CeritaKita Booking - Project Status Report
# Usage: ./project-report.sh

PROJECT_ROOT="/home/claudia/.picoclaw/workspace/ceritakita-booking"
DB_PATH="$PROJECT_ROOT/data/bookings.db"

echo "📊 CeritaKita Booking - Project Report"
echo "======================================"
echo ""
echo "📅 Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Git Info
echo "🔀 Git Repository"
echo "----------------"
cd "$PROJECT_ROOT"
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
GIT_STATUS=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
echo "   Branch: $GIT_BRANCH"
echo "   Commit: $GIT_COMMIT"
echo "   Modified files: $GIT_STATUS"
echo ""

# 2. Dependencies
echo "📦 Dependencies"
echo "--------------"
if [ -f "$PROJECT_ROOT/package.json" ]; then
    DEP_COUNT=$(grep -c '"dependencies"' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "0")
    DEV_DEP_COUNT=$(grep -c '"devDependencies"' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "0")
    echo "   Dependencies: $DEP_COUNT"
    echo "   Dev Dependencies: $DEV_DEP_COUNT"
fi
echo ""

# 3. Docker Status
echo "🐳 Docker"
echo "---------"
if docker ps --format '{{.Names}}' | grep -q "^ceritakita-booking$"; then
    DOCKER_STATUS="running"
    DOCKER_IMAGE=$(docker inspect --format='{{.Config.Image}}' ceritakita-booking 2>/dev/null)
    CONTAINER_CREATED=$(docker inspect --format='{{.Created}}' ceritakita-booking 2>/dev/null | cut -d'T' -f1)
    echo "   Status: $DOCKER_STATUS"
    echo "   Image: $DOCKER_IMAGE"
    echo "   Created: $CONTAINER_CREATED"
else
    echo "   Status: stopped"
fi
echo ""

# 4. Database Stats
echo "💾 Database Statistics"
echo "-----------------------"
if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(du -h "$DB_PATH" 2>/dev/null | cut -f1)
    echo "   Size: $DB_SIZE"
    
    if command -v sqlite3 &> /dev/null; then
        BOOKINGS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM bookings;" 2>/dev/null || echo "0")
        PAYMENTS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM payments;" 2>/dev/null || echo "0")
        USERS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        LEADS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM leads;" 2>/dev/null || echo "0")
        PHOTOGRAPHERS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM photographers;" 2>/dev/null || echo "0")
        COUPONS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM coupons WHERE is_active = 1;" 2>/dev/null || echo "0")
        
        echo "   Bookings: $BOOKINGS"
        echo "   Payments: $PAYMENTS"
        echo "   Users: $USERS"
        echo "   Leads: $LEADS"
        echo "   Photographers: $PHOTOGRAPHERS"
        echo "   Active Coupons: $COUPONS"
        
        # Active bookings breakdown
        echo ""
        echo "   Booking Status:"
        ACTIVE=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM bookings WHERE status = 'Active';" 2>/dev/null || echo "0")
        COMPLETED=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM bookings WHERE status = 'Completed';" 2>/dev/null || echo "0")
        CANCELLED=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM bookings WHERE status = 'Cancelled';" 2>/dev/null || echo "0")
        echo "   - Active: $ACTIVE"
        echo "   - Completed: $COMPLETED"
        echo "   - Cancelled: $CANCELLED"
    fi
else
    echo "   Database not found"
fi
echo ""

# 5. Recent Bookings
echo "📅 Recent Bookings (Last 5)"
echo "----------------------------"
if [ -f "$DB_PATH" ] && command -v sqlite3 &> /dev/null; then
    sqlite3 "$DB_PATH" "SELECT datetime(created_at), customer_name, status, total_price/100000 || '00' FROM bookings ORDER BY created_at DESC LIMIT 5;" 2>/dev/null | while IFS='|' read -r date name status price; do
        if [ -n "$date" ]; then
            echo "   $date | $name | $status | Rp $price"
        fi
    done
fi
echo ""

# 6. Disk Usage
echo "💿 Disk Usage"
echo "-------------"
df -h "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print "   Used: " $3 " / " $2 " (" $5 ")"}'
echo ""

# 7. Recent Logs
echo "📋 Recent Activity (Last 24h)"
echo "------------------------------"
if [ -f "$PROJECT_ROOT/logs/app.log" ]; then
    TODAY=$(date +%Y-%m-%d)
    LINES=$(grep "$TODAY" "$PROJECT_ROOT/logs/app.log" 2>/dev/null | tail -10 | wc -l)
    echo "   Log entries today: $LINES"
fi
echo ""

# 8. Environment Status
echo "🔐 Environment Variables"
echo "-----------------------"
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    echo "   .env.local: exists"
    # Check for critical vars
    grep -q "NEXTAUTH_SECRET" "$PROJECT_ROOT/.env.local" && echo "   ✓ NEXTAUTH_SECRET: set" || echo "   ✗ NEXTAUTH_SECRET: missing"
    grep -q "B2_APPLICATION_KEY" "$PROJECT_ROOT/.env.local" && echo "   ✓ B2_KEY: set" || echo "   ✗ B2_KEY: missing"
    grep -q "META_ACCESS_TOKEN" "$PROJECT_ROOT/.env.local" && echo "   ✓ META_TOKEN: set" || echo "   ✗ META_TOKEN: missing"
else
    echo "   .env.local: missing"
fi
echo ""

echo "======================================"
echo "Report complete"
