/** CDN/browser cache headers: serve stale instantly, revalidate in the background. */
export function cacheHeaders(
  cacheSeconds: number,
  swrSeconds: number
): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${swrSeconds}`,
  };
}

/** Strong ETag (SHA-1 of the payload) using the Edge-available Web Crypto API. */
export async function etagFor(payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `"${hex}"`;
}
