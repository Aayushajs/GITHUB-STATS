import { getEnv } from "@/config/env";
import { etagFor } from "./cache";
import { getStats } from "./github/aggregate";
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
