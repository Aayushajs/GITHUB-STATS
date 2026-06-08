import type { AggregatedStats } from "@/lib/github/types";
import { icon, type IconName } from "../icons";
import { fmt, fmtCompact, escapeXml, svgDocument } from "../primitives";
import type { ResolvedTheme } from "../tokens";

function showNum(v: number): string {
  return v >= 100000 ? fmtCompact(v) : fmt(v);
}

export interface StatsOptions {
  compact: boolean;
  hide: string[];
}

export function renderStatsCard(
  stats: AggregatedStats,
  theme: ResolvedTheme,
  opts: StatsOptions
): string {
  const { profile } = stats;
  const width = 460;
  const height = opts.compact ? 184 : 230;
  const P = 26;
  const right = width - P;
  const display = profile.name?.trim() || `@${profile.login}`;
  const hasPrivate = stats.privateContributions > 0;

  const cell = (
    col: number,
    baseline: number,
    name: IconName,
    value: number,
    label: string,
    delay: number
  ): string => {
    const x = P + col * 102;
    return `
    <g class="rise" style="animation-delay:${delay}s">
      ${icon(name, { x, y: baseline - 14, size: 15, color: theme.accent })}
      <text x="${x + 23}" y="${baseline}" class="num" font-size="17">${showNum(value)}</text>
      <text x="${x}" y="${baseline + 19}" class="lbl">${label}</text>
    </g>`;
  };

  const r1y = opts.compact ? 158 : 156;
  const row1 =
    cell(0, r1y, "commit", stats.totalCommits, "Commits", 0.06) +
    cell(1, r1y, "pr", profile.prsTotal, "Pull Requests", 0.1) +
    cell(2, r1y, "issue", stats.totalIssues, "Issues", 0.14) +
    cell(3, r1y, "review", stats.totalReviews, "Reviews", 0.18);

  const row2 = opts.compact
    ? ""
    : cell(0, 202, "repo", profile.reposTotal, "Repositories", 0.22) +
      cell(1, 202, "star", profile.starsTopSum, "Stars", 0.26) +
      cell(2, 202, "follower", profile.followers, "Followers", 0.3) +
      cell(3, 202, "org", profile.organizations, "Orgs", 0.34);

  // Public/private breakdown only when there's a private figure to show — avoids
  // a confusing "0 private" and avoids mislabelling a merged calendar as "public".
  // Top-right always carries a balanced two-line summary: the public/private
  // split when private data is available, otherwise this-year + streak.
  const lastYear = stats.calendar.slice(-365).reduce((s, d) => s + d.count, 0);
  const line = (y: number, value: string, label: string, accent = false): string =>
    `<text x="${right}" y="${y}" text-anchor="end" class="sub"><tspan style="fill:${accent ? theme.accent : theme.text};font-weight:700">${value}</tspan> ${label}</text>`;

  const breakdown = hasPrivate
    ? line(84, fmt(stats.publicContributions), "public") +
      line(106, fmt(stats.privateContributions), "private", true)
    : line(84, fmt(lastYear), "this year") +
      line(106, fmt(stats.currentStreak.length), "day streak");

  const heroLabel = "Total Contributions";

  const body = `
  <text x="${P}" y="38" class="title">${escapeXml(display)}</text>
  <text x="${right}" y="38" text-anchor="end" class="sub">@${escapeXml(profile.login)}</text>
  <line x1="${P}" y1="54" x2="${right}" y2="54" stroke="${theme.line}"/>

  <g class="rise">
    <text x="${P}" y="100" class="num" font-size="33">${fmt(stats.totalContributions)}</text>
    <text x="${P}" y="120" class="lbl">${heroLabel}</text>
  </g>
  ${breakdown}

  <line x1="${P}" y1="130" x2="${right}" y2="130" stroke="${theme.line}"/>
  ${row1}
  ${row2}`;

  return svgDocument({
    width,
    height,
    theme,
    title: `${display} — GitHub stats`,
    body,
  });
}
