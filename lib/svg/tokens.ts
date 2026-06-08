// Theme tokens for the "Obsidian Editorial" design language.

export interface Theme {
  bg: string; // base background (gradient bottom)
  bgSoft: string; // gradient top
  panel: string; // inner panel surface
  text: string; // primary text
  muted: string; // secondary text
  accent: string; // single accent
  line: string; // hairline divider
  border: string; // card border
  track: string; // empty heatmap cell / progress track
}

export interface ResolvedTheme extends Theme {
  radius: number;
  hideBorder: boolean;
}

export const THEMES: Record<string, Theme> = {
  dark: {
    bg: "#06080d",
    bgSoft: "#0b0e14",
    panel: "#0e1219",
    text: "#e6e8ee",
    muted: "#8b93a7",
    accent: "#e3b341",
    line: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.10)",
    track: "rgba(255,255,255,0.06)",
  },
  light: {
    bg: "#ffffff",
    bgSoft: "#f6f8fa",
    panel: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    accent: "#bf8700",
    line: "rgba(27,31,36,0.10)",
    border: "rgba(27,31,36,0.12)",
    track: "rgba(27,31,36,0.06)",
  },
};

const HEX = /^#?[0-9a-fA-F]{3,8}$/;

function normHex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!HEX.test(v)) return undefined;
  return v.startsWith("#") ? v : `#${v}`;
}

export interface ThemeOverrides {
  theme?: string;
  accent?: string;
  bg?: string;
  text?: string;
  radius?: number;
  hideBorder?: boolean;
}

/** Resolves a named theme and applies validated per-request overrides. */
export function resolveTheme(o: ThemeOverrides): ResolvedTheme {
  const base = THEMES[o.theme ?? "dark"] ?? THEMES.dark;
  const accent = normHex(o.accent) ?? base.accent;
  const bg = normHex(o.bg) ?? base.bg;
  const text = normHex(o.text) ?? base.text;
  return {
    ...base,
    accent,
    bg,
    bgSoft: o.bg ? bg : base.bgSoft,
    panel: o.bg ? bg : base.panel,
    text,
    radius: o.radius ?? 14,
    hideBorder: o.hideBorder ?? false,
  };
}
