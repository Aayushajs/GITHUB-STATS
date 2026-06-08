// Typed, validated access to environment variables.
// Server-only. The PAT must never reach the client.

export interface AppEnv {
  token: string;
  username: string;
  allowAnyUser: boolean;
  cacheSeconds: number;
  swrSeconds: number;
  rateLimitRpm: number;
}

function num(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

let cached: AppEnv | null = null;

/**
 * Reads and validates environment configuration.
 * Throws a clear error (surfaced as an error card) when required vars are missing.
 */
export function getEnv(): AppEnv {
  if (cached) return cached;

  const token = process.env.GITHUB_TOKEN?.trim();
  const username = process.env.GITHUB_USERNAME?.trim();

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }
  if (!username) {
    throw new Error(
      "GITHUB_USERNAME is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }

  cached = {
    token,
    username,
    allowAnyUser: process.env.ALLOW_ANY_USER?.trim().toLowerCase() === "true",
    cacheSeconds: num(process.env.CACHE_SECONDS, 3600),
    swrSeconds: num(process.env.SWR_SECONDS, 86400),
    rateLimitRpm: num(process.env.RATE_LIMIT_RPM, 30),
  };
  return cached;
}
