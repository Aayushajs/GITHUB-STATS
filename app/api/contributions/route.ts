import { handleCard } from "@/lib/handler";
import { renderContributionsCard } from "@/lib/svg/cards/contributions";

export const runtime = "edge";

export function GET(req: Request) {
  return handleCard(req, (stats, theme, params) =>
    renderContributionsCard(stats, theme, { compact: params.compact })
  );
}
