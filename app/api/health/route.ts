import { getEnv } from "@/config/env";
import { jsonResponse } from "@/lib/response";

export const runtime = "edge";

export function GET() {
  try {
    const env = getEnv();
    return jsonResponse({
      ok: true,
      user: env.username,
      allowAnyUser: env.allowAnyUser,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      500
    );
  }
}
