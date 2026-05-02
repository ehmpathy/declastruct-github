import { BadRequestError } from 'helpful-errors';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

/**
 * .what = looks up a GitHub user ID by username
 * .why = GitHub API requires numeric IDs for reviewers, but users prefer usernames
 */
export const getUserIdByUsername = async (
  input: { username: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<number> => {
  const github = getGithubClient({}, context);
  try {
    const { data } = await github.users.getByUsername({
      username: input.username,
    });
    return data.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not Found')) {
      throw new BadRequestError(`reviewer user '${input.username}' not found`, {
        username: input.username,
      });
    }
    throw error;
  }
};
