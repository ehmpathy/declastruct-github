import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';
import { hasContextWithAppToken } from '@src/domain.operations/context/hasContextWithAppToken';
import { hasContextWithPatToken } from '@src/domain.operations/context/hasContextWithPatToken';

import { castToDeclaredGithubRepo } from './castToDeclaredGithubRepo';

/**
 * .what = lists GitHub repositories
 * .why = retrieves multiple repos from GitHub API for declarative management
 */
export const getRepos = async (
  input: {
    where?: {
      owner?: string;
    };
    page?: {
      range?: { until: { page: number } };
      limit?: number;
    };
  },
  context: ContextGithubApi & VisualogicContext,
): Promise<HasMetadata<DeclaredGithubRepo>[]> => {
  // get cached GitHub client
  const github = getGithubClient({}, context);

  // detect token type for choosing appropriate endpoint
  const isAppToken = hasContextWithAppToken(null, context);
  const isPat = hasContextWithPatToken(null, context);

  // execute the GitHub API call
  try {
    const response = await (async () => {
      // if owner is specified, list repos for that org/user
      if (input.where?.owner) {
        return github.repos.listForOrg({
          org: input.where.owner,
          page: input.page?.range?.until.page,
          per_page: input.page?.limit,
        });
      }

      // list repos accessible to the authenticated context
      // - app token: use installation endpoint (listForAuthenticatedUser not available)
      // - PAT: use user endpoint
      if (isAppToken) {
        const result = await github.apps.listReposAccessibleToInstallation({
          page: input.page?.range?.until.page,
          per_page: input.page?.limit,
        });
        return { data: result.data.repositories };
      }
      if (isPat) {
        return github.repos.listForAuthenticatedUser({
          page: input.page?.range?.until.page,
          per_page: input.page?.limit,
        });
      }
      throw new UnexpectedCodePathError(
        'unsupported token type for listing repos',
        { tokenPrefix: context.github.token.slice(0, 10) + '...' },
      );
    })();

    const repos = response.data ?? [];
    return repos.map(castToDeclaredGithubRepo);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    throw new HelpfulError('github.getRepos error', { cause: error });
  }
};
