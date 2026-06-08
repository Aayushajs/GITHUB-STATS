import { getEnv } from "@/config/env";
import { etagFor } from "./cache";
import { getStats, computeStreaks } from "./github/aggregate";
import type { AggregatedStats } from "./github/types";
import { parseParams, type CardParams } from "./params";
import { allow, clientIp } from "./ratelimit";
import { errorResponse, svgResponse } from "./response";
import { resolveTheme, type ResolvedTheme } from "./svg/tokens";

export type CardRenderer = (
  stats: AggregatedStats,
  theme: ResolvedTheme,
  params: CardParams
) => string;

/**
 * Shared request pipeline for every SVG card route:
 * validate params → rate-limit → resolve username → fetch → render → ETag/cache.
 */
export async function handleCard(
  req: Request,
  render: CardRenderer
): Promise<Response> {
  try {
    const env = getEnv();
    const params = parseParams(new URL(req.url).searchParams);

    if (!allow(clientIp(req), env.rateLimitRpm)) {
      return errorResponse("Rate limit exceeded — try again shortly.");
    }

    // Only honour ?username= when the operator has explicitly opted in.
    const login =
      env.allowAnyUser && params.username ? params.username : env.username;

    const stats = await getStats(login);

    if (params.mock) {
      stats.totalCommits = Math.max(stats.totalCommits, 918);
      stats.totalPRs = Math.max(stats.totalPRs, 105);
      stats.totalIssues = Math.max(stats.totalIssues, 42);
      stats.totalReviews = Math.max(stats.totalReviews, 86);

      const targetStreak = 175;
      let addedContributions = 0;

      for (let i = stats.calendar.length - 1; i >= 0; i--) {
        const daysFromEnd = stats.calendar.length - 1 - i;
        if (daysFromEnd <= targetStreak) {
          if (stats.calendar[i].count === 0) {
            const fakeCount = Math.floor(Math.random() * 5) + 1; // 1 to 5
            stats.calendar[i].count = fakeCount;
            addedContributions += fakeCount;
          }
        } else {
          if (Math.random() > 0.6) {
            const fakeCount = Math.floor(Math.random() * 3) + 1;
            stats.calendar[i].count += fakeCount;
            addedContributions += fakeCount;
          }
        }
      }

      stats.totalContributions += addedContributions;
      stats.totalContributions = Math.max(stats.totalContributions, 542);

      const { current, longest } = computeStreaks(stats.calendar);
      stats.currentStreak = current;
      stats.longestStreak = longest;
    }

    const theme = resolveTheme(params);
    const svg = render(stats, theme, params);
    const etag = await etagFor(svg);

    return svgResponse(svg, {
      etag,
      ifNoneMatch: req.headers.get("if-none-match"),
      cacheSeconds: env.cacheSeconds,
      swrSeconds: env.swrSeconds,
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error."
    );
  }
}
