import type { AggregatedStats } from "@/lib/github/types";
import { icon, type IconName } from "../icons";
import { fmt, fmtCompact, escapeXml, svgDocument } from "../primitives";
import type { ResolvedTheme } from "../tokens";

function showNum(v: number): string {
  return v >= 100000 ? fmtCompact(v) : fmt(v);
}

// A derived overall grade from real activity — not a fabricated metric, just a
// readable summary (like the rank circles popular profile cards use).
function computeRank(s: AggregatedStats): { grade: string; pct: number } {
  const p = s.profile;
  const score =
    s.totalContributions +
    s.totalCommits * 0.5 +
    p.prsTotal * 3 +
    s.totalIssues * 2 +
    s.totalReviews * 2 +
    p.starsTopSum * 2 +
    p.followers * 1.5;
  const tiers: [number, string, number][] = [
    [5000, "S", 0.96],
    [2800, "A+", 0.9],
    [1200, "A", 0.8],
    [700, "A-", 0.71],
    [300, "B+", 0.58],
    [100, "B", 0.45],
    [0, "C", 0.32],
  ];
  for (const [min, grade, pct] of tiers) if (score >= min) return { grade, pct };
  return { grade: "C", pct: 0.32 };
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
  const height = opts.compact ? 196 : 244;
  const P = 26;
  const right = width - P;
  const display = profile.name?.trim() || `@${profile.login}`;
  const hasPrivate = stats.privateContributions > 0;

  const lastYear = stats.calendar.slice(-365).reduce((s, d) => s + d.count, 0);
  const secondary = hasPrivate
    ? `${fmt(stats.publicContributions)} public · ${fmt(stats.privateContributions)} private`
    : `${fmt(lastYear)} this year · ${fmt(stats.currentStreak.length)} day streak`;

  // ── Rank ring (right of the hero) ──────────────────────────────────────
  const { grade, pct } = computeRank(stats);
  const rcx = 392;
  const rcy = 90;
  const rr = 29;
  const circ = 2 * Math.PI * rr;
  const arc = (pct * circ).toFixed(1);
  const ring = `
  <g class="rise" style="animation-delay:.1s">
    <circle cx="${rcx}" cy="${rcy}" r="${rr}" fill="none" stroke="${theme.track}" stroke-width="5"/>
    <circle cx="${rcx}" cy="${rcy}" r="${rr}" fill="none" stroke="url(#accent)" stroke-width="5"
            stroke-linecap="round" stroke-dasharray="${arc} ${circ.toFixed(1)}"
            transform="rotate(-90 ${rcx} ${rcy})"/>
    <text x="${rcx}" y="${rcy + 6}" text-anchor="middle" class="num" font-size="19">${grade}</text>
    <text x="${rcx}" y="${rcy + 44}" text-anchor="middle" class="lbl">Rank</text>
  </g>`;

  // ── Metric grid ────────────────────────────────────────────────────────
  const gridTop = opts.compact ? 150 : 152;
  const cell = (
    col: number,
    rowBase: number,
    name: IconName,
    value: number,
    label: string,
    delay: number
  ): string => {
    const x = P + col * 102;
    return `
    <g class="rise" style="animation-delay:${delay}s">
      ${icon(name, { x, y: rowBase - 14, size: 15, color: theme.accent })}
      <text x="${x + 23}" y="${rowBase}" class="num" font-size="17">${showNum(value)}</text>
      <text x="${x}" y="${rowBase + 19}" class="lbl">${label}</text>
    </g>`;
  };

  const row1 =
    cell(0, gridTop + 14, "commit", stats.totalCommits, "Commits", 0.14) +
    cell(1, gridTop + 14, "pr", profile.prsTotal, "Pull Requests", 0.18) +
    cell(2, gridTop + 14, "issue", stats.totalIssues, "Issues", 0.22) +
    cell(3, gridTop + 14, "review", stats.totalReviews, "Reviews", 0.26);

  const row2 = opts.compact
    ? ""
    : cell(0, gridTop + 60, "repo", profile.reposTotal, "Repositories", 0.3) +
      cell(1, gridTop + 60, "star", profile.starsTopSum, "Stars", 0.34) +
      cell(2, gridTop + 60, "follower", profile.followers, "Followers", 0.38) +
      cell(3, gridTop + 60, "org", profile.organizations, "Orgs", 0.42);

  const body = `
  <text x="${P}" y="38" class="title">${escapeXml(display)}</text>
  <text x="${right}" y="38" text-anchor="end" class="sub">@${escapeXml(profile.login)}</text>
  <line x1="${P}" y1="54" x2="${right}" y2="54" stroke="${theme.line}"/>

  <g class="rise">
    <text x="${P}" y="96" class="num" font-size="32">${fmt(stats.totalContributions)}</text>
    <text x="${P}" y="115" class="lbl">Total Contributions</text>
    <text x="${P}" y="135" class="sub" font-size="11">${secondary}</text>
  </g>
  ${ring}

  <line x1="${P}" y1="${gridTop - 4}" x2="${right}" y2="${gridTop - 4}" stroke="${theme.line}"/>
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
