import "server-only";

/**
 * Limiteur simple en mémoire (par instance). Suffisant pour un VPS unique ;
 * sur Vercel (plusieurs instances), remplacez-le par Upstash Redis si besoin.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count++;
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  return bucket.count <= limit;
}
