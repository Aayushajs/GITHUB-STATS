// Crafted line/solid icons on a 24×24 grid. Consistent, minimal, not emoji.

export type IconName =
  | "commit"
  | "pr"
  | "issue"
  | "review"
  | "repo"
  | "org"
  | "star"
  | "follower"
  | "flame";

interface Glyph {
  d: string;
  fill: boolean; // true → solid fill, false → stroke (line)
}

const GLYPHS: Record<IconName, Glyph> = {
  commit: {
    d: '<circle cx="12" cy="12" r="3.5"/><path d="M2 12h6.5M15.5 12H22"/>',
    fill: false,
  },
  pr: {
    d: '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M6 8.4v7.2M18 15.6v-4a3 3 0 0 0-3-3h-3.5"/><path d="M13 5l-2 3 2 3"/>',
    fill: false,
  },
  issue: {
    d: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6"/>',
    fill: false,
  },
  review: {
    d: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.4l2.6 2.6 5.2-5.8"/>',
    fill: false,
  },
  repo: {
    d: '<path d="M6 3h12a1 1 0 0 1 1 1v16H7a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2z"/><path d="M7 17h12"/>',
    fill: false,
  },
  org: {
    d: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9.5 21v-5h5v5"/><path d="M8 10.5h0.01M16 10.5h0.01"/>',
    fill: false,
  },
  star: {
    d: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.7l1.2-6L3.3 9.3l6.1-.7z"/>',
    fill: true,
  },
  follower: {
    d: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    fill: false,
  },
  flame: {
    d: '<path d="M12 22a7 7 0 0 0 7-7c0-3-2-5.2-3.2-7.2-1.4 2-3.1 2-3.1-1.1 0-2 1-3.4 1-4.7-4.2 1-8.7 5-8.7 13A7 7 0 0 0 12 22z"/>',
    fill: true,
  },
};

export interface IconOptions {
  x: number;
  y: number;
  size?: number;
  color?: string;
  className?: string;
}

/** Renders an icon positioned at (x,y) scaled to `size`px (default 18). */
export function icon(name: IconName, o: IconOptions): string {
  const size = o.size ?? 18;
  const scale = size / 24;
  const color = o.color ?? "currentColor";
  const g = GLYPHS[name];
  const paint = g.fill
    ? `fill="${color}" stroke="none"`
    : `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const cls = o.className ? ` class="${o.className}"` : "";
  return `<g${cls} transform="translate(${o.x} ${o.y}) scale(${scale})" ${paint}>${g.d}</g>`;
}
