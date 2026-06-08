// Shared types for the GitHub data layer.

export interface DayContribution {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface YearContribution {
  year: number;
  calendarTotal: number; // contributionCalendar.totalContributions (visible)
  restricted: number; // restrictedContributionsCount (private, when hidden)
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  repos: number;
  days: DayContribution[];
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  createdAt: string;
  followers: number;
  following: number;
  organizations: number;
  reposTotal: number;
  reposPublic: number;
  reposPrivate: number;
  starsTopSum: number; // sum of stargazers across top-100 repos by stars
  prsTotal: number; // opened lifetime (all states)
  prsMerged: number;
  prsOpen: number;
  prsClosed: number; // closed, not merged
  issuesOpen: number;
  issuesClosed: number;
}

export interface StreakInfo {
  length: number;
  startDate: string | null;
  endDate: string | null;
}

export interface AggregatedStats {
  profile: GitHubProfile;
  totalContributions: number;
  publicContributions: number;
  privateContributions: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  currentStreak: StreakInfo;
  longestStreak: StreakInfo;
  calendar: DayContribution[]; // full daily series, ascending by date
  years: number[];
  generatedAt: string;
}
