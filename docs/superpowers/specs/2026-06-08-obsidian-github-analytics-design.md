# Obsidian — Self-Hosted GitHub Analytics

**Date:** 2026-06-08
**Owner:** aj
**Goal:** Self-hosted alternative to github-readme-stats + streak-stats + github-profile-trophy + summary-cards, rendering premium SVG cards for a GitHub profile README. Single-profile (owner's PAT), free Vercel-native infra.

## Decisions (locked)

- **Design language:** "Obsidian Editorial" — premium dark theme. Graphite gradient base, hairline dividers, big tabular numbers, UPPERCASE tracked labels, crafted line icons (no emoji), one customizable accent (default gold `#E3B341`), 14px radius, SVG-native micro-animations with `prefers-reduced-motion` support.
- **Build:** Phased. Phase 1 ships a complete, deployable MVP.
- **Infra:** Vercel-native only (Edge runtime, CDN cache via `Cache-Control`, ETag/304). No Redis/Sentry/OTel in Phase 1.
- **Stack:** Next.js 15 (App Router), TypeScript, Edge functions, GitHub GraphQL (REST only where needed). No heavy deps; hand-rolled SVG builder (enables animations + small bundle).

## Architecture

```
GET /api/<card>?theme=&accent=&...
  → validate+clamp params (params.ts)
  → rate-limit (in-memory token bucket, best-effort)
  → resolve username (env GITHUB_USERNAME, or ?username= iff ALLOW_ANY_USER)
  → GitHub GraphQL fetch (client.ts) — multi-year aliased query
  → aggregate (aggregate.ts): streaks, totals, public/private split
  → render SVG (svg/cards/*.ts) using design tokens
  → response.ts: Cache-Control s-maxage + SWR, ETag → 304 on match
  → Vercel CDN caches the SVG; most hits never reach the function
```

## Units (each: purpose / interface / deps)

- `config/env.ts` — typed env access. `getEnv()` → `{ token, username, allowAnyUser, cacheSeconds, swrSeconds, rateLimitRpm }`. Throws clear error if token/username missing.
- `lib/github/client.ts` — `githubGraphQL(query, vars)` → JSON. Adds `Authorization: bearer`, `User-Agent`. Handles GraphQL errors + rate-limit headers.
- `lib/github/queries.ts` — query builders. `buildStatsQuery(login, years[])` returns a single query with one aliased `contributionsCollection` per year + profile/repos/followers/orgs.
- `lib/github/aggregate.ts` — pure functions. `computeStreaks(days[])`, `aggregateTotals(rawByYear)`, `splitPublicPrivate(...)`. No I/O.
- `lib/github/types.ts` — shared types.
- `lib/svg/tokens.ts` — theme presets (`dark`, `light`) + token resolution from params (accent/bg/text/radius/hideBorder).
- `lib/svg/primitives.ts` — `svg()`, `text()`, `rect()`, `group()`, `animate helpers`, `escapeXml()`, number formatting.
- `lib/svg/icons.ts` — inline line-icon paths (commit, pr, issue, review, repo, org, star, follower, flame).
- `lib/svg/cards/{stats,streak,contributions,activity}.ts` — `renderXCard(data, theme)` → SVG string.
- `lib/params.ts` — `parseParams(searchParams)` → validated `{ theme, accent?, compact, hide[], username? }`. Enum/regex/clamp validation.
- `lib/cache.ts` — `cacheHeaders(seconds, swr)`, `etagFor(payload)`.
- `lib/ratelimit.ts` — `allow(ip)` in-memory token bucket per isolate.
- `lib/response.ts` — `svgResponse(svg, { etag, ifNoneMatch, cacheSeconds, swrSeconds })`, `errorCard(msg)`.
- `app/api/<card>/route.ts` — Edge route handlers wiring the above.
- `app/page.tsx` — live playground: theme/accent controls + live card previews + copy-paste README snippets.

## Data model (what each card shows)

- **stats:** total/public/private contributions, total commits, PRs (opened/merged/closed), issues, reviews, repos, stars, followers, orgs.
- **streak:** total contributions, current streak (+range), longest streak (+range), with flame.
- **contributions:** GitHub-style calendar heatmap (accent tonal ramp), animated cell fade-in.
- **activity:** recent activity summary — last-N-weeks sparkline/line graph + per-type counts.
- **health:** JSON `{ ok, time, rateRemaining }` — no SVG.

## Streak algorithm

1. Build daily series from account-creation year → today; fill missing days with 0.
2. `totalContributions` = sum (owner token ⇒ includes private).
3. `currentStreak`: walk backward from today while `count>0`. If today=0 but yesterday>0, count from yesterday (today not-yet-contributed doesn't break).
4. `longestStreak`: longest run of consecutive `count>0` days; keep start/end dates.

## Security / abuse

- PAT server-only (`GITHUB_TOKEN`), never in any response/SVG.
- Default serves only `GITHUB_USERNAME`. `?username=` honored only when `ALLOW_ANY_USER=true`.
- All params validated: `theme` enum, `accent`/colors hex regex, numeric clamps, `hide` allowlist.
- Best-effort per-IP token bucket; CDN cache absorbs most load.
- Recommended PAT scopes: `read:user`, `repo` (private contribution counts), `read:org`.

## Caching

- `Cache-Control: public, max-age=0, s-maxage=<CACHE_SECONDS=3600>, stale-while-revalidate=<SWR=86400>`.
- `ETag` = hash of rendered SVG; `If-None-Match` ⇒ `304`.

## Phasing

- **Phase 1 (now):** scaffold, env, GraphQL client, aggregation, Obsidian design system, cards: stats/streak/contributions/activity + health, caching/security/validation, playground page, deploy guide, README snippets. Deployable.
- **Phase 2:** languages, repositories, reviews, stars, trophies, productivity + 8 scores, weekly/monthly/yearly graphs, animated graph, full light/custom themes, compact/expanded modes.
- **Phase 3 (optional):** Upstash Redis, Sentry/OTel, background refresh, expanded tests.

## Out of scope (Phase 1)

Redis, Sentry, OpenTelemetry, database (none needed — stateless + CDN cache), multi-user private data.
