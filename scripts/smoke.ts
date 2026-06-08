// Smoke test: render every card with deterministic mock data (no GitHub call),
// write sample SVGs to /samples, and assert basic well-formedness.
// Run: npx tsx scripts/smoke.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { renderStatsCard } from "../lib/svg/cards/stats";
import { renderStreakCard } from "../lib/svg/cards/streak";
import { renderContributionsCard } from "../lib/svg/cards/contributions";
import { renderActivityCard } from "../lib/svg/cards/activity";
import { resolveTheme } from "../lib/svg/tokens";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Deterministic 371-day calendar with streaks and gaps.
const calendar = Array.from({ length: 371 }, (_, i) => {
  const idx = 370 - i; // ascending dates
  const count = idx % 13 === 0 ? 0 : ((idx * 7) % 9) + (idx % 5 === 0 ? 6 : 0);
  return { date: isoDaysAgo(idx), count };
});
const publicContributions = calendar.reduce((s, d) => s + d.count, 0);

const mock = {
  profile: {
    login: "octodev",
    name: "Octo Dev",
    avatarUrl: "",
    createdAt: "2019-03-14T00:00:00Z",
    followers: 1280,
    following: 342,
    organizations: 6,
    reposTotal: 148,
    reposPublic: 120,
    reposPrivate: 28,
    starsTopSum: 9213,
    prsTotal: 312,
    prsMerged: 256,
    prsOpen: 12,
    prsClosed: 44,
    issuesOpen: 18,
    issuesClosed: 78,
  },
  totalContributions: publicContributions + 1204,
  publicContributions,
  privateContributions: 1204,
  totalCommits: 12840,
  totalPRs: 312,
  totalIssues: 96,
  totalReviews: 140,
  currentStreak: { length: 37, startDate: "2026-05-03", endDate: "2026-06-08" },
  longestStreak: { length: 128, startDate: "2023-01-10", endDate: "2023-05-17" },
  calendar,
  years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  generatedAt: new Date().toISOString(),
} as const;

const dark = resolveTheme({ theme: "dark" });
const light = resolveTheme({ theme: "light" });
const violet = resolveTheme({ theme: "dark", accent: "#7c8aff" });

const outputs: Record<string, string> = {
  "stats-dark.svg": renderStatsCard(mock as never, dark, { compact: false, hide: [] }),
  "stats-compact.svg": renderStatsCard(mock as never, dark, { compact: true, hide: [] }),
  "stats-light.svg": renderStatsCard(mock as never, light, { compact: false, hide: [] }),
  "streak-dark.svg": renderStreakCard(mock as never, dark),
  "streak-violet.svg": renderStreakCard(mock as never, violet),
  "contributions-dark.svg": renderContributionsCard(mock as never, dark, { compact: false }),
  "contributions-compact.svg": renderContributionsCard(mock as never, dark, { compact: true }),
  "activity-dark.svg": renderActivityCard(mock as never, dark),
  "activity-violet.svg": renderActivityCard(mock as never, violet),
};

mkdirSync("samples", { recursive: true });

let failures = 0;
for (const [name, svg] of Object.entries(outputs)) {
  writeFileSync(`samples/${name}`, svg);
  const problems: string[] = [];
  if (!svg.startsWith("<svg")) problems.push("missing <svg> root");
  if (!svg.trimEnd().endsWith("</svg>")) problems.push("missing </svg> close");
  if (/\bNaN\b/.test(svg)) problems.push("contains NaN");
  if (/undefined/.test(svg)) problems.push("contains undefined");
  if (/="\s*"/.test(svg.replace(/(class|style)="[^"]*"/g, ""))) {
    /* allow empty class/style */
  }
  const open = (svg.match(/<svg/g) || []).length;
  const close = (svg.match(/<\/svg>/g) || []).length;
  if (open !== close) problems.push(`svg open/close mismatch (${open}/${close})`);

  const status = problems.length ? `FAIL: ${problems.join(", ")}` : "ok";
  if (problems.length) failures++;
  console.log(`${problems.length ? "✗" : "✓"} ${name.padEnd(26)} ${svg.length} bytes  ${status}`);
}

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}  → samples/`);
if (failures > 0) process.exit(1);
