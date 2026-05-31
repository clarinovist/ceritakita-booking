/**
 * Bot/crawler filter and rate limiter for WA click tracking.
 *
 * Meta ad validators crawl ad links periodically. These hits inflate
 * wa_clicks by ~47% if not filtered. This module identifies them by
 * IP pattern and User-Agent, and provides an in-memory rate limiter
 * to prevent repeat-click inflation.
 *
 * IMPORTANT: Bot requests are still redirected to WhatsApp — we only
 * skip the DB log and CAPI event. This ensures Meta's ad validation
 * passes (which requires a working redirect) while keeping our
 * analytics data clean.
 */

// ── Bot IP detection ──────────────────────────────────────────

/**
 * Known bot/crawler IP ranges that inflate WA click metrics.
 *
 * Sources:
 * - 2a03:2880:*  → Meta/Facebook IPv6 crawler range (confirmed by ad auditing)
 * - 31.13.*      → Meta IPv4 (rare in our logs but documented)
 * - 157.240.*    → Meta IPv4
 * - 69.63.*      → Meta IPv4
 * - 35.*, 47.*, 52.*, 54.*  → AWS/cloud IPs (common for ad validation crawlers)
 * - 158.140.*    → Alibaba Cloud (seen in logs)
 * - 172.16-31.*  → Private/Docker internal IPs
 * - 127.0.0.1    → localhost
 */
const BOT_IP_PATTERNS: Array<{ pattern: string; reason: string }> = [
  { pattern: '2a03:2880:', reason: 'Meta IPv6 crawler (Facebook/Meta ad validation)' },
  { pattern: '31.13.', reason: 'Meta IPv4 range' },
  { pattern: '157.240.', reason: 'Meta IPv4 range' },
  { pattern: '69.63.', reason: 'Meta IPv4 range' },
  { pattern: '35.', reason: 'AWS cloud IP (likely crawler)' },
  { pattern: '47.', reason: 'AWS/Alibaba cloud IP (likely crawler)' },
  { pattern: '52.', reason: 'AWS cloud IP (likely crawler)' },
  { pattern: '54.', reason: 'AWS cloud IP (likely crawler)' },
  { pattern: '158.140.', reason: 'Alibaba Cloud IP (likely crawler)' },
  { pattern: '172.17.', reason: 'Docker bridge network' },
  { pattern: '172.18.', reason: 'Docker bridge network' },
  { pattern: '172.19.', reason: 'Docker bridge network' },
  { pattern: '172.2', reason: 'Private network (172.20-31.x.x.x)' },
  { pattern: '172.30.', reason: 'Private network' },
  { pattern: '172.31.', reason: 'Private network' },
  { pattern: '192.168.', reason: 'Private network' },
  { pattern: '10.', reason: 'Private network' },
  { pattern: '127.0.0.1', reason: 'Localhost' },
  { pattern: '::1', reason: 'Localhost IPv6' },
];

/** Known bot User-Agent substrings */
const BOT_UA_PATTERNS = [
  'facebookexternalhit',
  'facebookcatalog',
  'Facebot',
  'FacebookBot',
  'Meta-ExternalAgent',
  'WhatsAppBot',
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Slackbot',
  'Twitterbot',
  'LinkedInBot',
  'curl/',
  'wget/',
  'python-requests',
  'axios/',
  'node-fetch',
  'undici',
  'HTTPie',
];

export interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

/**
 * Check if a request is from a bot/crawler based on IP and User-Agent.
 *
 * Returns { isBot: true, reason } if bot, { isBot: false } if human.
 */
export function isBotRequest(ip: string, userAgent?: string): BotCheckResult {
  // 1. Check IP against known bot patterns
  for (const { pattern, reason } of BOT_IP_PATTERNS) {
    if (ip.startsWith(pattern) || ip === pattern) {
      return { isBot: true, reason: `${reason} (IP: ${ip})` };
    }
  }

  // 2. Check User-Agent for bot signatures
  if (userAgent) {
    const uaLower = userAgent.toLowerCase();
    for (const botPattern of BOT_UA_PATTERNS) {
      if (uaLower.includes(botPattern.toLowerCase())) {
        return { isBot: true, reason: `Bot UA: ${botPattern} (${userAgent.substring(0, 80)})` };
      }
    }
  } else {
    // No User-Agent at all — suspicious
    return { isBot: true, reason: 'Missing User-Agent header' };
  }

  return { isBot: false };
}

// ── In-memory rate limiter ─────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

export interface RateLimitResult {
  allowed: boolean;
  hits: number;
}

export interface RateLimiterConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max hits per IP within the window */
  maxHits: number;
}

/**
 * Create an in-memory rate limiter.
 *
 * Uses a Map of IP → timestamp[]. On each check, prunes expired entries
 * and returns whether the IP is allowed (under maxHits in the window).
 *
 * Memory usage: bounded by number of unique IPs per window (auto-pruned).
 */
export function createRateLimiter(config: RateLimiterConfig): (ip: string) => RateLimitResult {
  const { windowMs, maxHits } = config;
  const store = new Map<string, RateLimitEntry>();

  // Prune expired entries every 5 minutes to bound memory
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    store.forEach((entry: RateLimitEntry, ip: string) => {
      entry.timestamps = entry.timestamps.filter((t: number) => now - t < windowMs);
      if (entry.timestamps.length === 0) {
        keysToDelete.push(ip);
      }
    });
    keysToDelete.forEach((ip: string) => store.delete(ip));
  }, 5 * 60 * 1000);

  return (ip: string): RateLimitResult => {
    const now = Date.now();

    let entry = store.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(ip, entry);
    }

    // Prune expired timestamps for this IP
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

    // Check if under limit
    if (entry.timestamps.length >= maxHits) {
      return { allowed: false, hits: entry.timestamps.length };
    }

    // Record this hit
    entry.timestamps.push(now);
    return { allowed: true, hits: entry.timestamps.length };
  };
}