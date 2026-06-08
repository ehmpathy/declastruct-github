import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';
import { castToDeclaredGithubTeam } from './castToDeclaredGithubTeam';

/**
 * .what = extracts org and slug from team unique ref
 * .why = validates and transforms generic input to typed unique key
 */
const extractOrgAndSlugFromUniqueRef = (input: {
  by: PickOne<{ unique: RefByUnique<typeof DeclaredGithubTeam> }>;
}): { org: string; slug: string } => {
  // validate unique ref provided
  if (!input.by.unique) {
    UnexpectedCodePathError.throw('not referenced by unique', { input });
  }

  return {
    org: input.by.unique.org.login,
    slug: input.by.unique.slug,
  };
};

/**
 * .what = fetches team from GitHub API, returns null if not found
 * .why = communicator that handles GitHub 404 responses as null for idempotency
 */
const getTeamFromGithubOrNull = async (
  input: { org: string; slug: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<HasMetadata<DeclaredGithubTeam> | null> => {
  const github = getGithubClient({}, context);

  try {
    const response = await github.teams.getByName({
      org: input.org,
      team_slug: input.slug,
    });
    return castToDeclaredGithubTeam({ data: response.data, org: input.org });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: return null if team not found
    if (isGithubNotFoundError({ error })) return null;

    throw new MalfunctionError('github.getTeam error', {
      cause: error,
      org: input.org,
      slug: input.slug,
    });
  }
};

/**
 * .what = gets a GitHub Team by org and slug
 * .why = retrieves current state of team for declarative management
 */
export const getOneTeam = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubTeam>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubTeam> | null> => {
    // extract org and slug from input
    const { org, slug } = extractOrgAndSlugFromUniqueRef(input);

    // fetch team from GitHub
    return getTeamFromGithubOrNull({ org, slug }, context);
  },
);
