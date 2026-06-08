import { handleCard } from "@/lib/handler";
import { renderActivityCard } from "@/lib/svg/cards/activity";

export const runtime = "edge";

export function GET(req: Request) {
  return handleCard(req, (stats, theme) => renderActivityCard(stats, theme));
}
