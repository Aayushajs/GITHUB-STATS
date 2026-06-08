import type { ResolvedTheme } from "./tokens";

export const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif";

const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);
}

/** Thousands grouping without relying on Intl/ICU (Edge-safe). */
export function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Compact form: 1.2k, 34k, 1.3M. */
export function fmtCompact(n: number): string {
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${(v < 10 ? v.toFixed(1) : Math.round(v).toString()).replace(/\.0$/, "")}k`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2024-04-12" → "Apr 12, 2024" (no Intl/ICU dependency). */
export function formatDay(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2024-04-12" → "Apr 2024". */
export function formatMonthYear(iso: string | null): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return "—";
  return `${MONTHS[m - 1]} ${y}`;
}

/** Short month name for a 1-based month index. */
export function monthShort(month1: number): string {
  return MONTHS[clamp(month1 - 1, 0, 11)];
}

/** Maps a contribution count to a 0–4 heatmap intensity level. */
export function intensityLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  const q = max / 4;
  if (count <= q) return 1;
  if (count <= q * 2) return 2;
  if (count <= q * 3) return 3;
  return 4;
}

/** Fill-opacity per heatmap level (level 0 uses the track colour instead). */
export function levelOpacity(level: number): number {
  return [0, 0.28, 0.5, 0.74, 1][clamp(level, 0, 4)];
}

export interface DocumentOptions {
  width: number;
  height: number;
  theme: ResolvedTheme;
  title: string;
  body: string;
  defs?: string;
  styles?: string;
}

/**
 * Wraps card body content in a complete, self-contained SVG document:
 * gradient background, optional hairline border, top highlight, base text
 * styles, shared animation keyframes, and a prefers-reduced-motion guard.
 */
export function svgDocument(o: DocumentOptions): string {
  const { width, height, theme, title, body } = o;
  const r = theme.radius;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.bgSoft}"/>
      <stop offset="1" stop-color="${theme.bg}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.accent}"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0.65"/>
    </linearGradient>
    <linearGradient id="hi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="60%">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.18"/>
      <stop offset="0.6" stop-color="${theme.accent}" stop-opacity="0.03"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
    ${o.defs ?? ""}
  </defs>
  <style>
    text{font-family:${FONT};}
    .lbl{fill:${theme.muted};font-size:9.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;}
    .num{fill:${theme.text};font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;}
    .sub{fill:${theme.muted};font-size:11px;font-weight:500;}
    .title{fill:${theme.text};font-size:15px;font-weight:800;letter-spacing:-0.01em;}
    .accent{fill:${theme.accent};}
    .panel{fill:${theme.panel};stroke:${theme.border};stroke-width:1;}
    .panel-hi{fill:none;stroke:rgba(255,255,255,0.06);stroke-width:1;}
    @keyframes rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    @keyframes pop{from{opacity:0;transform:scale(0.85);}to{opacity:1;transform:scale(1);}}
    @keyframes draw{to{stroke-dashoffset:0;}}
    @keyframes flick{0%,100%{opacity:0.95;transform:scale(1);}50%{opacity:0.75;transform:scale(1.06);}}
    /* Animations are a progressive enhancement */
    @media (prefers-reduced-motion: no-preference){
      .rise{opacity:0;animation:rise .6s cubic-bezier(.16,1,.3,1) forwards;}
      .cell{opacity:0;animation:pop .4s cubic-bezier(.34,1.56,0.64,1) forwards;transform-box:fill-box;transform-origin:center;}
      .anim-draw{stroke-dasharray:var(--dash);stroke-dashoffset:var(--dash);animation:draw 1.4s cubic-bezier(.22,1,.36,1) .15s forwards;}
      .flame{transform-box:fill-box;transform-origin:center bottom;animation:flick 2.0s ease-in-out infinite;}
    }
    ${o.styles ?? ""}
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${r}" fill="url(#bg)" ${
    theme.hideBorder ? "" : `stroke="${theme.border}"`
  }/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${r}" fill="url(#glow)"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${Math.min(height - 1, r + 12)}" rx="${r}" fill="url(#hi)"/>
  ${body}
</svg>`;
}
