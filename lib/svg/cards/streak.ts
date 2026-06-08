import type { AggregatedStats, StreakInfo } from "@/lib/github/types";
import { icon } from "../icons";
import {
  fmt,
  escapeXml,
  formatDay,
  formatMonthYear,
  svgDocument,
} from "../primitives";
import type { ResolvedTheme } from "../tokens";

function currentRange(s: StreakInfo): string {
  if (s.length === 0) return "No active streak";
  return `${formatDay(s.startDate)} — Present`;
}

function longestRange(s: StreakInfo): string {
  if (s.length === 0) return "—";
  return `${formatDay(s.startDate)} — ${formatDay(s.endDate)}`;
}

export function renderStreakCard(
  stats: AggregatedStats,
  theme: ResolvedTheme
): string {
  const width = 460;
  const height = 200;
  const c1 = 80;
  const c2 = 230;
  const c3 = 380;

  const ring = `
  <circle cx="${c2}" cy="92" r="35" fill="none" stroke="${theme.track}" stroke-width="3.5"/>
  <circle cx="${c2}" cy="92" r="35" fill="none" stroke="url(#accent)" stroke-width="3.5"
          stroke-linecap="round" transform="rotate(-90 ${c2} 92)"
          class="anim-draw" style="--dash:219.9"/>`;

  const flame = icon("flame", {
    x: c2 - 10,
    y: 40,
    size: 20,
    color: theme.accent,
    className: "flame",
  });

  const body = `
  <line x1="155" y1="44" x2="155" y2="170" stroke="${theme.line}"/>
  <line x1="305" y1="44" x2="305" y2="170" stroke="${theme.line}"/>

  <g class="rise">
    <text x="${c1}" y="98" text-anchor="middle" class="num" font-size="27">${fmt(stats.totalContributions)}</text>
    <text x="${c1}" y="120" text-anchor="middle" class="lbl">Total</text>
    <text x="${c1}" y="150" text-anchor="middle" class="sub" font-size="10">Since ${escapeXml(formatMonthYear(stats.profile.createdAt))}</text>
  </g>

  <g class="rise" style="animation-delay:.08s">
    ${ring}
    ${flame}
    <text x="${c2}" y="101" text-anchor="middle" class="num" font-size="30">${fmt(stats.currentStreak.length)}</text>
    <text x="${c2}" y="148" text-anchor="middle" class="lbl accent">Current Streak</text>
    <text x="${c2}" y="167" text-anchor="middle" class="sub" font-size="10">${escapeXml(currentRange(stats.currentStreak))}</text>
  </g>

  <g class="rise" style="animation-delay:.16s">
    <text x="${c3}" y="98" text-anchor="middle" class="num" font-size="27">${fmt(stats.longestStreak.length)}</text>
    <text x="${c3}" y="120" text-anchor="middle" class="lbl">Longest</text>
    <text x="${c3}" y="150" text-anchor="middle" class="sub" font-size="10">${escapeXml(longestRange(stats.longestStreak))}</text>
  </g>`;

  return svgDocument({
    width,
    height,
    theme,
    title: `${stats.profile.login} — GitHub streak`,
    body,
  });
}
