import { cacheHeaders } from "./cache";
import { escapeXml, svgDocument } from "./svg/primitives";
import { resolveTheme } from "./svg/tokens";

export interface SvgResponseOptions {
  etag: string;
  ifNoneMatch: string | null;
  cacheSeconds: number;
  swrSeconds: number;
}

/** Returns the SVG, or a 304 when the client's ETag still matches. */
export function svgResponse(svg: string, o: SvgResponseOptions): Response {
  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    ETag: o.etag,
    ...cacheHeaders(o.cacheSeconds, o.swrSeconds),
  };
  if (o.ifNoneMatch && o.ifNoneMatch === o.etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(svg, { status: 200, headers });
}

/** A small, on-brand error card so READMEs show a helpful message, not a broken image. */
export function errorCardSvg(message: string): string {
  const theme = resolveTheme({ theme: "dark" });
  const width = 480;
  const height = 116;
  const msg = escapeXml(message.slice(0, 150));
  const body = `
  <rect x="0.5" y="0.5" width="4" height="${height - 1}" fill="#f85149"/>
  <text x="28" y="48" class="title">Couldn’t load GitHub stats</text>
  <text x="28" y="74" class="sub">${msg}</text>`;
  return svgDocument({ width, height, theme, title: "Error", body });
}

/** Error responses render a card (HTTP 200 so README embeds show it) with a short cache. */
export function errorResponse(message: string): Response {
  return new Response(errorCardSvg(message), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=30",
    },
  });
}

export function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=30",
    },
  });
}
