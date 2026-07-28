#!/usr/bin/env python3
"""CeritaKita Booking Daily Report — Telegram
v2: Includes Meta Ads insights from meta_insights_daily + campaign breakdown.
Reads SQLite directly (no Graph API for performance data).
"""
import json, sqlite3, sys
from datetime import datetime, timedelta
sys.path.insert(0, "/root/monitoring")
from telegram_rich import send_rich_html

DB_PATH = "/root/ceritakita-booking/data/bookings.db"

env = {}
with open("/root/monitoring/.env") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v

BOT_TOKEN = env.get("BOT_TOKEN", "")
CHAT_ID = env.get("CHAT_ID", "")

def query(sql, params=()):
    db = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    try:
        rows = db.execute(sql, params).fetchall()
        return rows
    except Exception as e:
        print(f"DB error: {e}")
        return []
    finally:
        db.close()

def md_to_html(text):
    import re
    text = re.sub(r'\*([^*]+)\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text

def send_telegram(msg):
    if not BOT_TOKEN:
        return False
    try:
        html = md_to_html(msg)
        result = send_rich_html(html, chat_id=CHAT_ID, bot_token=BOT_TOKEN)
        return result.get("ok", False)
    except Exception as e:
        print(f"Telegram error: {e}")
        return False

def build_report():
    now = datetime.now()
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")
    date_str = now.strftime("%A, %d %B %Y")
    esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    html = []
    html.append(f"<b>📊 CeritaKita Booking — Daily Report</b>")
    html.append(f"📅 {esc(date_str)}")
    html.append("")

    # === META ADS (DB-first) ===
    # Yesterday insights
    ads_yesterday = query("""
        SELECT COALESCE(SUM(spend),0) as spend, COALESCE(SUM(impressions),0) as imp,
               COALESCE(SUM(inline_link_clicks),0) as clicks, COALESCE(SUM(reach),0) as reach,
               COALESCE(AVG(ctr),0) as ctr, COALESCE(AVG(cpc),0) as cpc
        FROM meta_insights_daily WHERE date_record = ?
    """, (yesterday,))

    # Last 7 days insights
    ads_7d = query("""
        SELECT COALESCE(SUM(spend),0) as spend, COALESCE(SUM(impressions),0) as imp,
               COALESCE(SUM(inline_link_clicks),0) as clicks, COALESCE(SUM(reach),0) as reach,
               COALESCE(AVG(ctr),0) as ctr, COALESCE(AVG(cpc),0) as cpc
        FROM meta_insights_daily WHERE date_record >= ? AND date_record <= ?
    """, (week_ago, yesterday))

    # Best/worst campaigns last 3d
    campaigns_3d = query("""
        SELECT c.id, c.name, c.status,
               COALESCE(SUM(i.spend),0) as spend,
               COALESCE(SUM(i.inline_link_clicks),0) as clicks,
               COALESCE(AVG(i.ctr),0) as ctr
        FROM meta_campaigns c
        LEFT JOIN meta_insights_daily i ON i.campaign_id = c.id AND i.date_record >= ?
        GROUP BY c.id HAVING spend > 0
        ORDER BY spend DESC
    """, ((now - timedelta(days=3)).strftime("%Y-%m-%d"),))

    html.append("<b>━━━ META ADS ━━━</b>")

    if ads_yesterday:
        r = ads_yesterday[0]
        spend, imp, clicks, reach, ctr, cpc = r
        html.append(f"<b>Kemarin:</b>")
        html.append(f"💸 Spend: <b>Rp {spend:,.0f}</b> | 👁 Imp: <b>{imp:,}</b> | 🔗 Clicks: <b>{clicks}</b>")
        html.append(f"📊 CTR: <b>{ctr:.1f}%</b> | CPC: <b>Rp {cpc:,.0f}</b> | 👥 Reach: {reach:,}")
    else:
        html.append("_Tidak ada data kemarin_")

    if ads_7d:
        r = ads_7d[0]
        spend, imp, clicks, reach, ctr, cpc = r
        html.append(f"\n<b>7 Hari Terakhir:</b>")
        html.append(f"💸 Spend: <b>Rp {spend:,.0f}</b> | 👁 Imp: <b>{imp:,}</b> | 🔗 Clicks: <b>{clicks}</b>")
        html.append(f"📊 CTR: <b>{ctr:.1f}%</b> | CPC: <b>Rp {cpc:,.0f}</b>")
    html.append("")

    # Campaign breakdown
    if campaigns_3d:
        html.append("<b>🏆 Campaigns (3d):</b>")
        html.append('<table bordered striped>')
        html.append("<tr><th>Campaign</th><th>Spend</th><th>Clicks</th><th>CTR</th></tr>")
        for cid, name, status, spend, clicks, ctr in campaigns_3d:
            icon = "🟢" if status == "ACTIVE" else "⚪"
            html.append(f"<tr><td>{icon} {esc(name[:30])}</td><td>Rp {spend:,.0f}</td><td>{clicks}</td><td>{ctr:.1f}%</td></tr>")
        html.append("</table>")
    html.append("")

    # === WA CLICKS (7d) ===
    wa_7d = query("""
        SELECT DATE(clicked_at) as day, COUNT(*) as cnt
        FROM wa_clicks WHERE clicked_at >= datetime('now', '-7 days')
        GROUP BY day ORDER BY day DESC
    """)
    wa_total = query("SELECT COUNT(*) FROM wa_clicks")[0][0]

    if wa_7d:
        html.append("<b>━━━ WA CLICKS (7d) ━━━</b>")
        html.append('<table bordered striped>')
        html.append("<tr><th>Date</th><th>Clicks</th></tr>")
        for day, cnt in wa_7d:
            marker = " 🔥" if cnt > 100 else ""
            html.append(f"<tr><td>{esc(day)}</td><td>{cnt}{marker}</td></tr>")
        html.append("</table>")
    html.append(f"📊 Total: {wa_total} clicks")
    html.append("")

    # === TRAFFIC (7d) ===
    daily = query("""
        SELECT DATE(visited_at) as day, COUNT(*) as views, COUNT(DISTINCT visitor_id) as uv
        FROM website_traffic WHERE visited_at >= datetime('now', '-7 days')
        GROUP BY day ORDER BY day DESC
    """)
    total_pv = sum(r[1] for r in daily)
    total_uv = sum(r[2] for r in daily)

    html.append("<b>━━━ TRAFFIC (7d) ━━━</b>")
    html.append(f"👥 Unique Visitors: <b>{total_uv}</b>  📄 Views: <b>{total_pv}</b>")
    html.append("")

    # === LEADS ===
    leads_7d = query("SELECT COUNT(*) FROM leads WHERE created_at >= datetime('now', '-7 days')")[0][0]
    leads_30d = query("SELECT COUNT(*) FROM leads WHERE created_at >= datetime('now', '-30 days')")[0][0]
    leads_total = query("SELECT COUNT(*) FROM leads")[0][0]

    html.append("<b>━━━ LEADS ━━━</b>")
    html.append(f"🎯 7d: <b>{leads_7d}</b> | 30d: <b>{leads_30d}</b> | Total: <b>{leads_total}</b>")
    html.append("")

    # === BOOKINGS ===
    bookings_total = query("SELECT COUNT(*) FROM bookings")[0][0]
    revenue = query("SELECT COALESCE(SUM(amount), 0) FROM payments")[0][0]

    html.append("<b>━━━ BOOKINGS ━━━</b>")
    html.append(f"📋 Total: <b>{bookings_total}</b> | 💰 Revenue: <b>Rp {revenue:,.0f}</b>")
    html.append("")

    return "\n".join(html)


def main():
    print(f"[{datetime.now()}] Starting CeritaKita report...")
    report = build_report()

    if len(report) <= 4096:
        ok = send_telegram(report)
        print(f"{'OK' if ok else 'FAILED'} — {len(report)} chars")
    else:
        sections = report.split("━━━")
        chunks, current = [], ""
        for section in sections:
            candidate = current + "━━━" + section
            if len(candidate) > 3800:
                if current:
                    chunks.append(current)
                current = "━━━" + section
            else:
                current = candidate
        if current:
            chunks.append(current)
        for i, chunk in enumerate(chunks):
            ok = send_telegram(chunk)
            print(f"Part {i+1}/{len(chunks)}: {'OK' if ok else 'FAILED'} — {len(chunk)} chars")

    print(f"[{datetime.now()}] Done.")


if __name__ == "__main__":
    main()
