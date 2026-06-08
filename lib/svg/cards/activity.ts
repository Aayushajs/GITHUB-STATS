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

  const gx0 = P;
  const gx1 = right;
  const gyBottom = 122;
  const gyTop = 66;
  const step = n > 1 ? (gx1 - gx0) / (n - 1) : 0;
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

  const midY = ((gyTop + gyBottom) / 2).toFixed(1);
  const gridlines = `
    <line x1="${gx0}" y1="${gyTop}" x2="${gx1}" y2="${gyTop}" stroke="${theme.line}" stroke-dasharray="2 4"/>
    <line x1="${gx0}" y1="${midY}" x2="${gx1}" y2="${midY}" stroke="${theme.line}" stroke-dasharray="2 4"/>
    <line x1="${gx0}" y1="${gyBottom}" x2="${gx1}" y2="${gyBottom}" stroke="${theme.line}" stroke-dasharray="2 4"/>`;

  const sumLast7 = counts.slice(-7).reduce((s, c) => s + c, 0);
  const avg = (counts.reduce((s, c) => s + c, 0) / Math.max(1, n)).toFixed(1);
  const busiest = Math.max(0, ...counts);

  const metric = (col: number, value: string, label: string, delay: number) => {
    const x = P + col * 102;
    return `
    <g class="rise" style="animation-delay:${delay}s">
      <rect x="${x}" y="150" width="16" height="2.5" rx="1.25" fill="${theme.accent}"/>
      <text x="${x}" y="174" class="num" font-size="17">${value}</text>
      <text x="${x}" y="192" class="lbl">${label}</text>
    </g>`;
  };

  const defs = `
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </linearGradient>`;

  const body = `
  <text x="${P}" y="38" class="title">Recent Activity</text>
  <text x="${right}" y="38" text-anchor="end" class="sub">last 30 days</text>
  <line x1="${P}" y1="54" x2="${right}" y2="54" stroke="${theme.line}"/>

  ${gridlines}
  ${areaPath ? `<path d="${areaPath}" fill="url(#area)"/>` : ""}
  ${
    n > 1
      ? `<polyline points="${linePts}" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="anim-draw" style="--dash:560"/>`
      : ""
  }
  ${lastPt ? `<circle cx="${lastPt[0].toFixed(1)}" cy="${lastPt[1].toFixed(1)}" r="3.5" fill="${theme.accent}" class="cell" style="animation-delay:1.3s"/>` : ""}

  <line x1="${P}" y1="138" x2="${right}" y2="138" stroke="${theme.line}"/>
  ${metric(0, fmt(sumLast7), "This Week", 0.06)}
  ${metric(1, avg, "Daily Avg", 0.1)}
  ${metric(2, fmt(busiest), "Busiest Day", 0.14)}
  ${metric(3, fmt(stats.currentStreak.length), "Streak", 0.18)}`;

  return svgDocument({
    width,
    height,
    theme,
    title: `${stats.profile.login} — recent activity`,
    body,
    defs,
  });
}
