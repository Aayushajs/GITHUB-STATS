import { getEnv } from "@/config/env";
import { jsonResponse } from "@/lib/response";

export const runtime = "edge";

export async function GET() {
  try {
    const env = getEnv();

    // Inspect the token's granted scopes (returned in a REST response header).
    // 'repo' scope is required to count private-repository contributions.
    let reachable = false;
    let scopes = "";
    let hasRepoScope = false;
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `bearer ${env.token}`,
          "User-Agent": "obsidian-github-analytics",
        },
      });
      reachable = res.ok;
      scopes = res.headers.get("x-oauth-scopes") ?? "";
      hasRepoScope = scopes
        .split(",")
        .map((s) => s.trim())
        .includes("repo");
    } catch {
      /* network/token failure surfaced via reachable=false */
    }

    return jsonResponse({
      ok: true,
      user: env.username,
      allowAnyUser: env.allowAnyUser,
      github: { reachable, scopes, hasRepoScope, privateCountable: hasRepoScope },
      hint: hasRepoScope
        ? "repo scope present — private contributions are counted."
        : "Add the 'repo' scope to GITHUB_TOKEN so private contributions are counted.",
      time: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      500
    );
  }
}
