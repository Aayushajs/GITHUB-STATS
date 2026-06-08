import { handleCard } from "@/lib/handler";
import { renderStatsCard } from "@/lib/svg/cards/stats";

export const runtime = "edge";

export function GET(req: Request) {
  return handleCard(req, (stats, theme, params) =>
    renderStatsCard(stats, theme, { compact: params.compact, hide: params.hide })
  );
}
