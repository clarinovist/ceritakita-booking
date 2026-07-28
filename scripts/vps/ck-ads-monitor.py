#!/usr/bin/env python3
"""CeritaKita Meta Ads Monitor v6 — DB-first + Telegram + PicoClaw
v6: Reads meta_insights_daily from SQLite (no Graph API for performance data).
Only hits Graph API for account balance (not stored in DB).
"""
import urllib.request, json, subprocess, os, sys, sqlite3
from datetime import datetime, timedelta
sys.path.insert(0, "/root/monitoring")
try:
    from telegram_rich import send_rich_html
except ImportError:
    send_rich_html = None
try:
    from picoclaw_dispatch import dispatch_ads_alert
except ImportError:
    dispatch_ads_alert = None

# === CONFIG ===
META_ENV_PATH = "/root/monitoring/.env.meta-ads"
DB_PATH = "/root/ceritakita-booking/data/bookings.db"
ACCOUNT = "act_203972264282201"

PICOCLAW_CONFIG = "/home/sekolahdesain/.picoclaw/config.json"
CHAT_ID = "6188346916"

CTR_CRITICAL = 1.5
CTR_WARNING = 2.0
CPC_CRITICAL = 8000
CPC_WARNING = 6000
BALANCE_URGENT = 200000
BALANCE_WARN = 500000

# === LOAD TOKENS ===
def load_env_token(path, key):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line.startswith(f"{key}="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    except FileNotFoundError:
        pass
    return None

def load_picoclaw_bot():
    try:
        with open(PICOCLAW_CONFIG) as f:
            d = json.load(f)
        tg = d.get("channel_list", {}).get("telegram", {}).get("settings", {})
        return tg.get("bot_token", "")
    except:
        return ""

TOKEN = load_env_token(META_ENV_PATH, "META_ACCESS_TOKEN_CK")
BOT_TOKEN = load_picoclaw_bot()
CHAT_ID_VAR = CHAT_ID

if not TOKEN:
    print("===REPORT===\n❌ Token not found in /root/monitoring/.env.meta-ads\n===DATA===\n{}")
    exit(1)

# === HELPERS ===
def fb_get(path):
    sep = "&" if "?" in path else "?"
    url = f"https://graph.facebook.com/v24.0/{path}{sep}access_token={TOKEN}"
    try:
        return json.loads(urllib.request.urlopen(url, timeout=10).read())
    except Exception as e:
        return {"error": str(e)}

def fmt_idr(val):
    try: return f"Rp {int(float(val)):,}"
    except: return "Rp 0"

def db_query(sql, params=()):
    db = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    try:
        rows = db.execute(sql, params).fetchall()
        return rows
    except Exception as e:
        print(f"DB error: {e}")
        return []
    finally:
        db.close()

def send_telegram(msg):
    if not BOT_TOKEN or not send_rich_html:
        return False
    try:
        result = send_rich_html(msg, chat_id=CHAT_ID_VAR, bot_token=BOT_TOKEN)
        return result.get("ok", False)
    except Exception as e:
        print(f"Telegram error: {e}")
        return False

now = datetime.now()
today = now.strftime("%Y-%m-%d")
yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

lines = []

# === CAPI HEALTH ===
try:
    resp = urllib.request.urlopen("http://127.0.0.1:3100/health", timeout=5).read()
    data = json.loads(resp)
    capi_ok = data.get("status") == "ok"
except:
    capi_ok = False

# === ACCOUNT BALANCE (Graph API - not in DB) ===
acc = fb_get(f"{ACCOUNT}?fields=balance,currency")
bal = acc.get("balance", "0")
bal_int = int(float(bal))

# === CAMPAIGNS FROM DB ===
campaign_rows = db_query("SELECT id, name, status FROM meta_campaigns ORDER BY name")
campaigns_status = [(r[0], r[1], r[2]) for r in campaign_rows]
unexpected_paused = [
    (cid, name) for cid, name, status in campaigns_status
    if status not in ('ACTIVE', 'PAUSED') and status is not None
]

# === ADSET INSIGHTS FROM DB ===
today_data = db_query("""
    SELECT adset_id, campaign_id,
           SUM(impressions) as imp, SUM(clicks) as clicks, SUM(spend) as spend,
           AVG(ctr) as ctr, AVG(cpc) as cpc, SUM(reach) as reach,
           AVG(frequency) as freq
    FROM meta_insights_daily
    WHERE date_record = ? AND adset_id IS NOT NULL AND adset_id != ''
    GROUP BY adset_id
""", (today,))

yesterday_data = db_query("""
    SELECT adset_id, campaign_id,
           SUM(impressions) as imp, SUM(clicks) as clicks, SUM(spend) as spend,
           AVG(ctr) as ctr, AVG(cpc) as cpc, SUM(reach) as reach,
           AVG(frequency) as freq
    FROM meta_insights_daily
    WHERE date_record = ? AND adset_id IS NOT NULL AND adset_id != ''
    GROUP BY adset_id
""", (yesterday,))

# Get adset names from meta_adsets
adset_names = {r[0]: r[1] for r in db_query("SELECT id, name FROM meta_adsets")}

# === CONTAINER STATUS ===
containers_ok = True
container_issues = []
try:
    proc = subprocess.run(["docker", "ps", "--format", "{{.Names}}: {{.Status}}"], capture_output=True, text=True, timeout=5)
    for ln in proc.stdout.strip().split("\n"):
        if ("capi" in ln.lower() or "ceritakita" in ln.lower()) and ("unhealthy" in ln.lower() or "exiting" in ln.lower()):
            containers_ok = False
            container_issues.append(ln.strip())
except:
    pass

# === AGGREGATE TODAY ===
total_imp = sum(r[2] for r in today_data)
total_clicks = sum(r[3] for r in today_data)
total_spend = sum(r[4] for r in today_data)
avg_ctr = (total_clicks / total_imp * 100) if total_imp > 0 else 0

# === EVALUATE ===
has_problem = not capi_ok or bal_int < BALANCE_URGENT or not containers_ok or len(unexpected_paused) > 0
has_warning = bal_int < BALANCE_WARN or avg_ctr < CTR_WARNING
ctr_alert = avg_ctr < CTR_CRITICAL

# === BUILD REPORT ===
html_parts = []
if has_problem or ctr_alert:
    html_parts.append("<b>❌ CERITAKITA ADS — MASALAH</b>")
elif has_warning:
    html_parts.append("<b>⚠️ CeritaKita Ads — Warning</b>")
else:
    html_parts.append("<b>✅ CeritaKita Ads — OK</b>")

html_parts.append(f"📅 {now.strftime('%d %b %Y %H:%M WIB')}")
html_parts.append("")

# Balance
if bal_int < BALANCE_URGENT:
    html_parts.append(f"💰 Saldo: <b>{fmt_idr(bal)}</b> — URGENT! Top-up sekarang!")
elif bal_int < BALANCE_WARN:
    days_left = max(1, bal_int // 50000)
    html_parts.append(f"💰 Saldo: <code>{fmt_idr(bal)}</code> (~{days_left} hari)")
else:
    html_parts.append(f"💰 Saldo: <code>{fmt_idr(bal)}</code>")

# Issues
if not capi_ok:
    html_parts.append("❌ CAPI Gateway DOWN!")
if not containers_ok:
    html_parts.append(f"❌ Container: {', '.join(container_issues)}")
for cid, name in unexpected_paused:
    html_parts.append(f"⚠️ <b>{name}</b> — status unexpected")

# Campaigns summary
if campaigns_status:
    html_parts.append("")
    html_parts.append("<b>📢 Campaigns:</b>")
    for cid, name, status in campaigns_status:
        icon = "🟢" if status == "ACTIVE" else "⚪" if status == "PAUSED" else "🔴"
        html_parts.append(f"   {icon} {name} — {status}")

# Performance by adset (today)
if today_data:
    html_parts.append("")
    html_parts.append("<b>📊 Hari Ini (per AdSet):</b>")
    html_parts.append('<table bordered striped>')
    html_parts.append("<tr><th>AdSet</th><th>Imp</th><th>Clicks</th><th>Spend</th><th>CTR</th><th>CPC</th></tr>")
    for r in today_data:
        adset_id, campaign_id, imp, clicks, spend, ctr, cpc, reach, freq = r
        name = adset_names.get(adset_id, adset_id[:20] if adset_id else "-")
        html_parts.append(f"<tr><td>{name}</td><td>{imp or 0:,}</td><td>{clicks or 0}</td><td>{fmt_idr(spend or 0)}</td><td>{ctr or 0:.1f}%</td><td>{fmt_idr(cpc or 0)}</td></tr>")
    html_parts.append("</table>")
else:
    html_parts.append("\n📊 <i>No ad data today (not yet synced?)</i>")

# Yesterday
if yesterday_data:
    html_parts.append("")
    html_parts.append("<b>📊 Kemarin:</b>")
    html_parts.append('<table bordered striped>')
    html_parts.append("<tr><th>AdSet</th><th>Imp</th><th>Spend</th><th>CTR</th></tr>")
    for r in yesterday_data:
        adset_id, _, imp, _, spend, ctr, _, _, _ = r
        name = adset_names.get(adset_id, adset_id[:20] if adset_id else "-")
        html_parts.append(f"<tr><td>{name}</td><td>{imp or 0:,}</td><td>{fmt_idr(spend or 0)}</td><td>{ctr or 0:.1f}%</td></tr>")
    html_parts.append("</table>")

# CTR/CPC Alerts
if avg_ctr < CTR_CRITICAL:
    html_parts.append(f"\n🔴 <b>CTR KRITIS:</b> {avg_ctr:.1f}% (min {CTR_CRITICAL}%)")
elif avg_ctr < CTR_WARNING:
    html_parts.append(f"\n🟡 CTR rendah: {avg_ctr:.1f}% (target {CTR_WARNING}%+)")

if not has_problem and not has_warning and not ctr_alert:
    html_parts.append("\nCAPI ✅ Campaign ✅ Container ✅")

report = "\n".join(html_parts)

# === OUTPUT ===
raw = {
    "balance": bal_int,
    "capi_healthy": capi_ok,
    "containers_healthy": containers_ok,
    "campaigns": [{"id": c[0], "name": c[1], "status": c[2]} for c in campaigns_status],
    "today_by_adset": [{"id": r[0], "campaign": r[1], "imp": r[2], "clicks": r[3], "spend": r[4], "ctr": r[5], "cpc": r[6]} for r in today_data],
    "yesterday_by_adset": [{"id": r[0], "campaign": r[1], "imp": r[2], "spend": r[4], "ctr": r[5]} for r in yesterday_data],
    "unexpected_paused": unexpected_paused,
    "avg_ctr": round(avg_ctr, 2),
    "total_spend_today": round(total_spend, 0),
}

print("===REPORT===")
print(report)
print("===DATA===")
print(json.dumps(raw, ensure_ascii=False))

# === SEND TO TELEGRAM ===
if BOT_TOKEN:
    ok = send_telegram(report)
    print(f"\nTelegram: {'OK' if ok else 'FAILED'}")

    # Dispatch to PicoClaw if issues
    try:
        issues_found = has_problem or avg_ctr < CTR_WARNING or not capi_ok
        if issues_found and dispatch_ads_alert:
            dispatch_ads_alert(
                campaign=campaigns_status[0][1] if campaigns_status else "Unknown",
                ctr=avg_ctr,
                cpc=0,
                spend=total_spend
            )
            print("Dispatched to PicoClaw for analysis")
    except Exception as e:
        print(f"PicoClaw dispatch failed: {e}")
else:
    print("\nTelegram: skipped (no bot token)")
