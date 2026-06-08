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
  return `${formatDay(s.startDate)} – Present`;
}

function longestRange(s: StreakInfo): string {
  if (s.length === 0) return "—";
  return `${formatDay(s.startDate)} – ${formatDay(s.endDate)}`;
}

export function renderStreakCard(
  stats: AggregatedStats,
  theme: ResolvedTheme
): string {
  const width = 460;
  const height = 210;
  const c1 = 78;
  const c2 = 230;
  const c3 = 382;

  // Decorative full ring drawn around the current-streak hero.
  const ring = `
  <circle cx="${c2}" cy="92" r="36" fill="none" stroke="${theme.track}" stroke-width="3"/>
  <circle cx="${c2}" cy="92" r="36" fill="none" stroke="url(#accent)" stroke-width="3"
          stroke-linecap="round" transform="rotate(-90 ${c2} 92)"
          class="anim-draw" style="--dash:226.2"/>`;

  const flame = icon("flame", {
    x: c2 - 11,
    y: 40,
    size: 22,
    color: theme.accent,
    className: "flame",
  });

  const body = `
  <g class="rise">
    <text x="${c1}" y="96" text-anchor="middle" class="num" font-size="28">${fmt(stats.totalContributions)}</text>
    <text x="${c1}" y="118" text-anchor="middle" class="lbl">TOTAL</text>
    <text x="${c1}" y="150" text-anchor="middle" class="sub" font-size="10">Since ${escapeXml(formatMonthYear(stats.profile.createdAt))}</text>
  </g>

  <line x1="153" y1="48" x2="153" y2="172" stroke="${theme.line}"/>
  <line x1="307" y1="48" x2="307" y2="172" stroke="${theme.line}"/>

  <g class="rise" style="animation-delay:.08s">
    ${ring}
    ${flame}
    <text x="${c2}" y="101" text-anchor="middle" class="num" font-size="30">${fmt(stats.currentStreak.length)}</text>
    <text x="${c2}" y="150" text-anchor="middle" class="lbl accent">CURRENT STREAK</text>
    <text x="${c2}" y="168" text-anchor="middle" class="sub" font-size="10">${escapeXml(currentRange(stats.currentStreak))}</text>
  </g>

  <g class="rise" style="animation-delay:.16s">
    <text x="${c3}" y="96" text-anchor="middle" class="num" font-size="28">${fmt(stats.longestStreak.length)}</text>
    <text x="${c3}" y="118" text-anchor="middle" class="lbl">LONGEST</text>
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
