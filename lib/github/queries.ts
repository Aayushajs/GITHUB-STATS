// GitHub GraphQL query builders.

export const PROFILE_QUERY = /* GraphQL */ `
  query Profile($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl
      createdAt
      followers { totalCount }
      following { totalCount }
      organizations { totalCount }
      reposTotal: repositories(ownerAffiliations: OWNER) { totalCount }
      reposPublic: repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
      reposPrivate: repositories(ownerAffiliations: OWNER, privacy: PRIVATE) { totalCount }
      topRepos: repositories(
        first: 100
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes { stargazerCount }
      }
      prsTotal: pullRequests { totalCount }
      prsMerged: pullRequests(states: MERGED) { totalCount }
      prsOpen: pullRequests(states: OPEN) { totalCount }
      prsClosed: pullRequests(states: CLOSED) { totalCount }
      issuesOpen: issues(states: OPEN) { totalCount }
      issuesClosed: issues(states: CLOSED) { totalCount }
    }
  }
`;

const YEAR_FIELDS = /* GraphQL */ `
  restrictedContributionsCount
  totalCommitContributions
  totalPullRequestContributions
  totalIssueContributions
  totalPullRequestReviewContributions
  totalRepositoryContributions
  contributionCalendar {
    totalContributions
    weeks {
      contributionDays {
        date
        contributionCount
      }
    }
  }
`;

/**
 * Builds a single query with one aliased contributionsCollection block per year.
 * Each block is bounded to its calendar year (current year capped at `nowIso`).
 */
export function buildContributionsQuery(years: number[], nowIso: string): string {
  const blocks = years
    .map((y) => {
      const from = `${y}-01-01T00:00:00Z`;
      const yearEnd = `${y}-12-31T23:59:59Z`;
      const to = yearEnd > nowIso ? nowIso : yearEnd;
      return `
      y${y}: contributionsCollection(from: "${from}", to: "${to}") {
        ${YEAR_FIELDS}
      }`;
    })
    .join("\n");

  return /* GraphQL */ `
    query Contributions($login: String!) {
      user(login: $login) {
${blocks}
      }
    }
  `;
}
