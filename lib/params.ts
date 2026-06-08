import { clamp } from "./svg/primitives";

export interface CardParams {
  theme: string;
  accent?: string;
  bg?: string;
  text?: string;
  radius: number;
  hideBorder: boolean;
  compact: boolean;
  hide: string[];
  username?: string;
}

const THEME_ENUM = new Set(["dark", "light"]);
const HEX = /^#?[0-9a-fA-F]{3,8}$/;
const USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function hex(v: string | null): string | undefined {
  return v && HEX.test(v.trim()) ? v.trim() : undefined;
}

/** Parses and validates all card query params. Invalid values fall back to safe defaults. */
export function parseParams(sp: URLSearchParams): CardParams {
  const themeRaw = (sp.get("theme") ?? "dark").toLowerCase();
  const username = sp.get("username")?.trim();

  return {
    theme: THEME_ENUM.has(themeRaw) ? themeRaw : "dark",
    accent: hex(sp.get("accent")),
    bg: hex(sp.get("bg")),
    text: hex(sp.get("text")),
    radius: clamp(Number(sp.get("radius")) || 14, 0, 28),
    hideBorder: sp.get("hide_border") === "true" || sp.get("hideBorder") === "true",
    compact: sp.get("compact") === "true",
    hide: (sp.get("hide") ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    username: username && USERNAME.test(username) ? username : undefined,
  };
}
