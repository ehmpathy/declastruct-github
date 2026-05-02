import { BadRequestError } from 'helpful-errors';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

/**
 * .what = looks up a GitHub team ID by org and slug
 * .why = GitHub API requires numeric IDs for team reviewers, but users prefer slugs
 * .note = requires read:org scope on the GitHub token
 */
export const getTeamIdBySlug = async (
  input: { org: string; slug: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<number> => {
  const github = getGithubClient({}, context);
  try {
    const { data } = await github.teams.getByName({
      org: input.org,
      team_slug: input.slug,
    });
    return data.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not Found')) {
      throw new BadRequestError(
        `reviewer team '${input.slug}' not found in org '${input.org}'`,
        { org: input.org, slug: input.slug },
      );
    }
    throw error;
  }
};
