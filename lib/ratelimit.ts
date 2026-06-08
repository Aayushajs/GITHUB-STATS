// Best-effort, in-memory per-IP token bucket. State lives per Edge isolate and
// resets on cold start — this is a guard against abuse bursts, not a hard quota.
// The CDN cache absorbs the vast majority of traffic before it reaches here.

interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED = 5000;

export function allow(ip: string, rpm: number): boolean {
  if (rpm <= 0) return true;

  const now = Date.now();
  const refillPerMs = rpm / 60000;

  if (buckets.size > MAX_TRACKED) buckets.clear();

  const b = buckets.get(ip) ?? { tokens: rpm, updated: now };
  b.tokens = Math.min(rpm, b.tokens + (now - b.updated) * refillPerMs);
  b.updated = now;

  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

/** Extracts a best-effort client IP from forwarding headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}
