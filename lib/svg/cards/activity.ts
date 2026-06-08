import type { AggregatedStats } from "@/lib/github/types";
import { fmt, svgDocument } from "../primitives";
import type { ResolvedTheme } from "../tokens";

export function renderActivityCard(
  stats: AggregatedStats,
  theme: ResolvedTheme
): string {
  const width = 460;
  const height = 200;
  const P = 26;
  const right = width - P;

  const last30 = stats.calendar.slice(-30);
  const counts = last30.map((d) => d.count);
  const n = counts.length;
  const maxV = Math.max(1, ...counts);

  // Graph geometry.
  const gx0 = P;
  const gx1 = right;
  const gyBottom = 126;
  const gyTop = 68;
  const innerW = gx1 - gx0;
  const step = n > 1 ? innerW / (n - 1) : 0;
  const pointY = (c: number) => gyBottom - (c / maxV) * (gyBottom - gyTop);

  const pts = counts.map((c, i) => [gx0 + i * step, pointY(c)] as const);
  const linePts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath =
    n > 0
      ? `M ${gx0},${gyBottom} L ${pts
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" L ")} L ${gx1},${gyBottom} Z`
      : "";
  const lastPt = pts[pts.length - 1];

  const sumLast7 = counts.slice(-7).reduce((s, c) => s + c, 0);
  const avg = (counts.reduce((s, c) => s + c, 0) / Math.max(1, n)).toFixed(1);
  const busiest = Math.max(0, ...counts);

  const metric = (x: number, value: string, label: string, delay: number) => `
    <g class="rise" style="animation-delay:${delay}s">
      <rect x="${x}" y="156" width="14" height="2.5" rx="1.25" fill="${theme.accent}"/>
      <text x="${x}" y="178" class="num" font-size="16">${value}</text>
      <text x="${x}" y="195" class="lbl">${label}</text>
    </g>`;

  const defs = `
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </linearGradient>`;

  const cols = [P, P + 102, P + 204, P + 306];

  const body = `
  <text x="${P}" y="36" class="title">Recent Activity</text>
  <text x="${right}" y="36" text-anchor="end" class="sub">last 30 days</text>
  <line x1="${P}" y1="50" x2="${right}" y2="50" stroke="${theme.line}"/>

  ${areaPath ? `<path d="${areaPath}" fill="url(#area)"/>` : ""}
  ${
    n > 1
      ? `<polyline points="${linePts}" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="anim-draw" style="--dash:560"/>`
      : ""
  }
  ${lastPt ? `<circle cx="${lastPt[0].toFixed(1)}" cy="${lastPt[1].toFixed(1)}" r="3.5" fill="${theme.accent}" class="cell" style="animation-delay:1.3s"/>` : ""}

  <line x1="${P}" y1="142" x2="${right}" y2="142" stroke="${theme.line}"/>
  ${metric(cols[0], fmt(sumLast7), "THIS WEEK", 0.06)}
  ${metric(cols[1], avg, "DAILY AVG", 0.1)}
  ${metric(cols[2], fmt(busiest), "BUSIEST DAY", 0.14)}
  ${metric(cols[3], fmt(stats.currentStreak.length), "STREAK", 0.18)}`;

  return svgDocument({
    width,
    height,
    theme,
    title: `${stats.profile.login} — recent activity`,
    body,
    defs,
  });
}
