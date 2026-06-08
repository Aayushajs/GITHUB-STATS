import type { AggregatedStats, DayContribution } from "@/lib/github/types";
import {
  fmt,
  intensityLevel,
  levelOpacity,
  monthShort,
  svgDocument,
} from "../primitives";
import type { ResolvedTheme } from "../tokens";

interface Cell {
  col: number;
  row: number;
  count: number;
}

const CELL = 11;
const STEP = 14;
const GRID_TOP = 66;
const PAD = 26;

function buildGrid(days: DayContribution[]) {
  const cells: Cell[] = [];
  const colMonth: number[] = [];
  let col = 0;
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    if (i > 0 && dow === 0) col++;
    if (colMonth[col] === undefined) colMonth[col] = Number(d.date.slice(5, 7));
    cells.push({ col, row: dow, count: d.count });
  }
  return { cells, weeks: col + 1, colMonth };
}

export function renderContributionsCard(
  stats: AggregatedStats,
  theme: ResolvedTheme,
  opts: { compact: boolean }
): string {
  const span = opts.compact ? 210 : 371;
  const days = stats.calendar.slice(-span);
  const { cells, weeks, colMonth } = buildGrid(days);

  const total = days.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));

  const gridWidth = weeks * STEP - (STEP - CELL);
  const width = PAD * 2 + gridWidth;
  const gridBottom = GRID_TOP + 7 * STEP - (STEP - CELL);
  const height = gridBottom + 40;

  let lastLabelCol = -3;
  let lastMonth = -1;
  const monthLabels = colMonth
    .map((m, col) => {
      if (m !== lastMonth && col - lastLabelCol >= 3) {
        lastMonth = m;
        lastLabelCol = col;
        return `<text x="${PAD + col * STEP}" y="58" class="lbl">${monthShort(m)}</text>`;
      }
      lastMonth = m;
      return "";
    })
    .join("");

  const rects = cells
    .map((c) => {
      const x = PAD + c.col * STEP;
      const y = GRID_TOP + c.row * STEP;
      const level = intensityLevel(c.count, max);
      const fill =
        level === 0
          ? `fill="${theme.track}"`
          : `fill="${theme.accent}" fill-opacity="${levelOpacity(level)}"`;
      const delay = Math.min(0.9, c.col * 0.013).toFixed(3);
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" ${fill} class="cell" style="animation-delay:${delay}s"/>`;
    })
    .join("");

  const legendX = width - PAD - 5 * 15 - 56;
  const legendY = gridBottom + 24;
  const legend =
    `<text x="${legendX}" y="${legendY + 9}" class="lbl">Less</text>` +
    [0, 1, 2, 3, 4]
      .map((lv) => {
        const x = legendX + 36 + lv * 15;
        const fill =
          lv === 0
            ? `fill="${theme.track}"`
            : `fill="${theme.accent}" fill-opacity="${levelOpacity(lv)}"`;
        return `<rect x="${x}" y="${legendY}" width="11" height="11" rx="2.5" ${fill}/>`;
      })
      .join("") +
    `<text x="${legendX + 36 + 5 * 15 + 6}" y="${legendY + 9}" class="lbl">More</text>`;

  const periodLabel = opts.compact ? "the last 30 weeks" : "the last year";

  const body = `
  <text x="${PAD}" y="38" class="title">Contributions</text>
  <text x="${width - PAD}" y="38" text-anchor="end" class="sub"><tspan style="fill:${theme.text};font-weight:700">${fmt(total)}</tspan> in ${periodLabel}</text>
  ${monthLabels}
  ${rects}
  <g class="rise" style="animation-delay:0.25s">${legend}</g>`;

  return svgDocument({
    width,
    height,
    theme,
    title: `${stats.profile.login} — contribution graph`,
    body,
  });
}
