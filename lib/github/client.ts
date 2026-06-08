import { getEnv } from "@/config/env";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; type?: string }[];
}

/**
 * Executes a GitHub GraphQL query server-side using the configured PAT.
 * The token is never returned to the caller.
 */
export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const env = getEnv();

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${env.token}`,
      "Content-Type": "application/json",
      // GitHub requires a User-Agent.
      "User-Agent": "obsidian-github-analytics",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "GitHub rejected the token (401/403). Check GITHUB_TOKEN scopes/validity."
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status}: ${body.slice(0, 160)}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`
    );
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL returned no data.");
  }
  return json.data;
}
