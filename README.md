# Obsidian — Self-Hosted GitHub Analytics

Premium, self-hosted SVG cards for your GitHub profile README. A single deploy
gives you **stats, streak, contribution graph, and activity** cards rendered
server-side from the GitHub GraphQL API — public **and** private contributions —
with a refined dark "Obsidian Editorial" look that doesn't resemble the usual
README widgets.

- ⚡ **Next.js 15 + Edge runtime** — fast, global, server-only token access
- 🎨 **Obsidian design system** — graphite gradients, hairline detail, crafted icons, tasteful SVG animations
- 🔒 **Your PAT, your data** — token lives only in env vars, never reaches the client
- 🆓 **Free infra** — Vercel CDN caching + ETag/304, no database, no Redis
- 🎛️ **Themeable** — `theme`, `accent`, `compact`, custom colors via query params

> **Status:** Phase 1 (MVP). Cards: `stats`, `streak`, `contributions`, `activity`.
> Roadmap below covers languages, repositories, trophies, scores, and more.

---

## Endpoints

| Endpoint | Card | Notes |
|---|---|---|
| `/api/stats` | Overview: contributions (public/private), commits, PRs, issues, reviews, repos, stars, followers, orgs | `compact`, `hide=private` |
| `/api/streak` | Total · current streak (with flame) · longest streak | — |
| `/api/contributions` | GitHub-style contribution heatmap | `compact` = last 30 weeks |
| `/api/activity` | Last-30-day activity graph + quick metrics | — |
| `/api/health` | JSON health check (no SVG) | — |

### Common query params

| Param | Values | Default | Applies to |
|---|---|---|---|
| `theme` | `dark`, `light` | `dark` | all |
| `accent` | hex (with/without `#`), e.g. `7c8aff` | `e3b341` | all |
| `bg` | hex — solid background override | theme bg | all |
| `text` | hex — primary text override | theme text | all |
| `radius` | `0`–`28` | `14` | all |
| `hide_border` | `true` | `false` | all |
| `compact` | `true` | `false` | `stats`, `contributions` |
| `hide` | comma list, e.g. `private` | — | `stats` |

---

## Quick start — deploy to Vercel

1. **Create a GitHub Personal Access Token** (see [scopes](#github-pat-permissions)).
2. **Import this folder into Vercel** (or push to a GitHub repo and import it).
3. **Add environment variables** in Vercel → *Settings → Environment Variables*:
   - `GITHUB_TOKEN` — your PAT
   - `GITHUB_USERNAME` — your GitHub username
   - (optional) `ALLOW_ANY_USER`, `CACHE_SECONDS`, `SWR_SECONDS`, `RATE_LIMIT_RPM`
4. **Deploy.** Your cards are live at `https://YOUR-APP.vercel.app/api/stats`.
5. Open `https://YOUR-APP.vercel.app/` for a live playground with copy-paste snippets.

Deploy with the CLI instead:

```bash
npm i -g vercel
vercel            # first deploy (links project)
vercel env add GITHUB_TOKEN
vercel env add GITHUB_USERNAME
vercel --prod
```

---

## GitHub PAT permissions

Create a **classic** token at <https://github.com/settings/tokens> with the
least privilege you need:

| Scope | Why |
|---|---|
| `read:user` | profile, followers, following, organizations |
| `repo` | **private** contribution counts (omit if you only want public data) |
| `read:org` | organization contributions |

> Fine-grained tokens also work: grant read-only access to *Profile*,
> *Contents*, and *Metadata*. Private contribution totals require access to your
> private repos.

### Public vs private contributions

GitHub controls how private activity surfaces via
**Settings → Profile → "Include private contributions on my profile"**:

- **OFF (recommended for an accurate split):** the calendar shows public days;
  private activity is reported separately via `restrictedContributionsCount`.
  Obsidian reports `public`, `private`, and a correct `total`.
- **ON:** private contributions are folded into the calendar (and the streak),
  but the public/private split is no longer separable — `private` will read ~0
  while `total` and the streak still include everything.

Pick whichever matches what you want to show. The math is documented in
[`lib/github/aggregate.ts`](lib/github/aggregate.ts).

---

## Embed in your README

```md
<!-- stats -->
![GitHub stats](https://YOUR-APP.vercel.app/api/stats)

<!-- streak -->
![GitHub streak](https://YOUR-APP.vercel.app/api/streak)

<!-- contribution graph -->
![Contributions](https://YOUR-APP.vercel.app/api/contributions)

<!-- recent activity -->
![Activity](https://YOUR-APP.vercel.app/api/activity)
```

Side by side, with a custom accent:

```md
<p align="center">
  <img src="https://YOUR-APP.vercel.app/api/stats?accent=7c8aff" width="49%" />
  <img src="https://YOUR-APP.vercel.app/api/streak?accent=7c8aff" width="49%" />
</p>
```

Light theme, compact, no border:

```md
![stats](https://YOUR-APP.vercel.app/api/stats?theme=light&compact=true&hide_border=true)
```

---

## Caching strategy

- Responses set `Cache-Control: s-maxage=<CACHE_SECONDS>, stale-while-revalidate=<SWR_SECONDS>`,
  so Vercel's CDN serves cached SVGs instantly and most requests never hit the function.
- A strong **ETag** (SHA-1 of the SVG) enables `304 Not Modified` responses.
- Defaults: 1h fresh, 24h stale-while-revalidate. Tune via env vars.

## Security hardening checklist

- [x] PAT stored in env vars, read **server-side only** — never serialized into any response or SVG.
- [x] Edge route handlers; no token exposure to the browser.
- [x] Service serves only `GITHUB_USERNAME` by default. `?username=` is honored **only** when `ALLOW_ANY_USER=true`.
- [x] All query params validated/clamped (theme enum, hex regex, numeric clamp, username pattern, `hide` allowlist).
- [x] Best-effort per-IP rate limiting on uncached requests.
- [x] Errors render an on-brand card with a safe message (no stack traces, no token).
- [ ] Use a token with the **minimum** scopes you need; rotate periodically.

---

## Local development

```bash
cp .env.example .env.local   # fill in GITHUB_TOKEN + GITHUB_USERNAME
npm install
npm run dev                  # http://localhost:3000
```

- `npm run typecheck` — TypeScript, no emit
- `npm run build` — production build

---

## Project structure

```
app/
  api/{stats,streak,contributions,activity,health}/route.ts   Edge routes
  page.tsx                                                     live playground
lib/
  github/{client,queries,aggregate,types}.ts                  data layer
  svg/{tokens,primitives,icons}.ts + svg/cards/*.ts           rendering engine
  {params,cache,ratelimit,response,handler}.ts                request pipeline
config/env.ts                                                 typed env access
docs/superpowers/specs/                                       design spec
```

## Roadmap

- **Phase 2:** languages, repositories, reviews, stars, trophies, productivity +
  8 analytics scores; weekly/monthly/yearly + animated graphs; full light/custom
  themes; compact/expanded modes for every card.
- **Phase 3 (optional):** Upstash Redis layer, Sentry + OpenTelemetry, background refresh.

---

Built as a self-hosted alternative to github-readme-stats, streak-stats,
github-profile-trophy, and profile-summary-cards — unified, themeable, and yours.
