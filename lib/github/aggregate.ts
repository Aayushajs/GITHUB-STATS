import { githubGraphQL } from "./client";
import { PROFILE_QUERY, buildContributionsQuery } from "./queries";
import type {
  AggregatedStats,
  DayContribution,
  GitHubProfile,
  StreakInfo,
} from "./types";

// ── Raw response shapes ───────────────────────────────────────────────────

interface RawProfile {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    createdAt: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    organizations: { totalCount: number };
    reposTotal: { totalCount: number };
    reposPublic: { totalCount: number };
    reposPrivate: { totalCount: number };
    topRepos: { nodes: { stargazerCount: number }[] };
    prsTotal: { totalCount: number };
    prsMerged: { totalCount: number };
    prsOpen: { totalCount: number };
    prsClosed: { totalCount: number };
    issuesOpen: { totalCount: number };
    issuesClosed: { totalCount: number };
  } | null;
}

interface RawYear {
  restrictedContributionsCount: number;
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoryContributions: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
  };
}

type RawContributions = { user: Record<string, RawYear> | null };

const EMPTY_STREAK: StreakInfo = { length: 0, startDate: null, endDate: null };

// ── Pure aggregation ──────────────────────────────────────────────────────

/**
 * Current streak walks back from today; a 0-contribution "today" does not break
 * the streak (it simply isn't counted yet). Longest streak is the longest run of
 * consecutive days with at least one contribution.
 */
export function computeStreaks(days: DayContribution[]): {
  current: StreakInfo;
  longest: StreakInfo;
} {
  if (days.length === 0) return { current: EMPTY_STREAK, longest: EMPTY_STREAK };

  let longest: StreakInfo = { ...EMPTY_STREAK };
  let runStart = 0;
  let runLen = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i].count > 0) {
      if (runLen === 0) runStart = i;
      runLen++;
      if (runLen > longest.length) {
        longest = {
          length: runLen,
          startDate: days[runStart].date,
          endDate: days[i].date,
        };
      }
    } else {
      runLen = 0;
    }
  }

  let i = days.length - 1;
  if (days[i].count === 0) i--; // today not contributed yet → don't break
  let curLen = 0;
  let curEnd: string | null = null;
  let curStart: string | null = null;
  while (i >= 0 && days[i].count > 0) {
    if (curEnd === null) curEnd = days[i].date;
    curStart = days[i].date;
    curLen++;
    i--;
  }

  return {
    current: { length: curLen, startDate: curStart, endDate: curEnd },
    longest,
  };
}

function parseProfile(raw: RawProfile): GitHubProfile {
  const u = raw.user;
  if (!u) throw new Error("GitHub user not found.");
  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    organizations: u.organizations.totalCount,
    reposTotal: u.reposTotal.totalCount,
    reposPublic: u.reposPublic.totalCount,
    reposPrivate: u.reposPrivate.totalCount,
    starsTopSum: u.topRepos.nodes.reduce((s, r) => s + r.stargazerCount, 0),
    prsTotal: u.prsTotal.totalCount,
    prsMerged: u.prsMerged.totalCount,
    prsOpen: u.prsOpen.totalCount,
    prsClosed: u.prsClosed.totalCount,
    issuesOpen: u.issuesOpen.totalCount,
    issuesClosed: u.issuesClosed.totalCount,
  };
}

// ── Orchestration ─────────────────────────────────────────────────────────

function yearRange(createdAt: string, now: Date): number[] {
  const startYear = new Date(createdAt).getUTCFullYear();
  const endYear = now.getUTCFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  return years;
}

/**
 * Fetches everything for a login and returns a fully aggregated stats object.
 * Two GitHub requests: profile, then one multi-year contributions query.
 */
export async function getStats(login: string): Promise<AggregatedStats> {
  const now = new Date();

  const profileRaw = await githubGraphQL<RawProfile>(PROFILE_QUERY, { login });
  const profile = parseProfile(profileRaw);

  const years = yearRange(profile.createdAt, now);
  const contribQuery = buildContributionsQuery(years, now.toISOString());
  const contribRaw = await githubGraphQL<RawContributions>(contribQuery, {
    login,
  });
  if (!contribRaw.user) throw new Error("GitHub user not found.");

  // Combine per-year data.
  const dayMap = new Map<string, number>();
  let publicContributions = 0;
  let privateContributions = 0;
  let totalCommits = 0;
  let totalReviews = 0;

  for (const year of years) {
    const block = contribRaw.user[`y${year}`];
    if (!block) continue;
    publicContributions += block.contributionCalendar.totalContributions;
    privateContributions += block.restrictedContributionsCount;
    totalCommits += block.totalCommitContributions;
    totalReviews += block.totalPullRequestReviewContributions;
    for (const week of block.contributionCalendar.weeks) {
      for (const d of week.contributionDays) {
        dayMap.set(d.date, d.contributionCount);
      }
    }
  }

  const calendar: DayContribution[] = [...dayMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const { current, longest } = computeStreaks(calendar);

  return {
    profile,
    totalContributions: publicContributions + privateContributions,
    publicContributions,
    privateContributions,
    totalCommits,
    totalPRs: profile.prsTotal,
    totalIssues: profile.issuesOpen + profile.issuesClosed,
    totalReviews,
    currentStreak: current,
    longestStreak: longest,
    calendar,
    years,
    generatedAt: now.toISOString(),
  };
}
