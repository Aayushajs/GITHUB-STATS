import { handleCard } from "@/lib/handler";
import { renderStreakCard } from "@/lib/svg/cards/streak";

export const runtime = "edge";

export function GET(req: Request) {
  return handleCard(req, (stats, theme) => renderStreakCard(stats, theme));
}
