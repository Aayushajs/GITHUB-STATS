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
  const height = opts.compact ? 178 : 232;
  const P = 26;
  const right = width - P;
  const display = profile.name?.trim() || `@${profile.login}`;

  const cell = (
    x: number,
    baseline: number,
    name: IconName,
    value: number,
    label: string,
    delay: number
  ): string => `
    <g class="rise" style="animation-delay:${delay}s">
      ${icon(name, { x, y: baseline - 14, size: 15, color: theme.accent })}
      <text x="${x + 23}" y="${baseline}" class="num" font-size="17">${showNum(value)}</text>
      <text x="${x}" y="${baseline + 19}" class="lbl">${label}</text>
    </g>`;

  const cols = [P, P + 102, P + 204, P + 306];

  const row1 =
    cell(cols[0], 150, "commit", stats.totalCommits, "COMMITS", 0.06) +
    cell(cols[1], 150, "pr", profile.prsTotal, "PULL REQUESTS", 0.1) +
    cell(cols[2], 150, "issue", stats.totalIssues, "ISSUES", 0.14) +
    cell(cols[3], 150, "review", stats.totalReviews, "REVIEWS", 0.18);

  const row2 = opts.compact
    ? ""
    : cell(cols[0], 196, "repo", profile.reposTotal, "REPOSITORIES", 0.22) +
      cell(cols[1], 196, "star", profile.starsTopSum, "STARS", 0.26) +
      cell(cols[2], 196, "follower", profile.followers, "FOLLOWERS", 0.3) +
      cell(cols[3], 196, "org", profile.organizations, "ORGS", 0.34);

  const privateLine = opts.hide.includes("private")
    ? ""
    : `<text x="${right}" y="104" text-anchor="end" class="sub"><tspan style="fill:${theme.text};font-weight:700">${fmt(stats.privateContributions)}</tspan> private</text>`;

  const body = `
  <text x="${P}" y="38" class="title">${escapeXml(display)}</text>
  <text x="${right}" y="38" text-anchor="end" class="sub">@${escapeXml(profile.login)}</text>
  <line x1="${P}" y1="52" x2="${right}" y2="52" stroke="${theme.line}"/>

  <g class="rise">
    <text x="${P}" y="98" class="num" font-size="34">${fmt(stats.totalContributions)}</text>
    <text x="${P}" y="118" class="lbl">TOTAL CONTRIBUTIONS</text>
  </g>
  <text x="${right}" y="84" text-anchor="end" class="sub"><tspan style="fill:${theme.text};font-weight:700">${fmt(stats.publicContributions)}</tspan> public</text>
  ${privateLine}

  <line x1="${P}" y1="128" x2="${right}" y2="128" stroke="${theme.line}"/>
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
