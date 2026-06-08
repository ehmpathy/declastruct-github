import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';
import { castToDeclaredGithubTeamMembership } from './castToDeclaredGithubTeamMembership';

/**
 * .what = extracts org, team slug, and username from membership unique ref
 * .why = validates and transforms generic input to typed unique key
 */
const extractMembershipDetailsFromUniqueRef = (input: {
  by: PickOne<{ unique: RefByUnique<typeof DeclaredGithubTeamMembership> }>;
}): { org: string; teamSlug: string; username: string } => {
  // validate unique ref provided
  if (!input.by.unique) {
    UnexpectedCodePathError.throw('not referenced by unique', { input });
  }

  return {
    org: input.by.unique.team.org.login,
    teamSlug: input.by.unique.team.slug,
    username: input.by.unique.username,
  };
};

/**
 * .what = fetches membership from GitHub API, returns null if not found
 * .why = communicator that handles GitHub 404 responses as null for idempotency
 */
const getMembershipFromGithubOrNull = async (
  input: { org: string; teamSlug: string; username: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<HasMetadata<DeclaredGithubTeamMembership> | null> => {
  const github = getGithubClient({}, context);

  try {
    const response = await github.teams.getMembershipForUserInOrg({
      org: input.org,
      team_slug: input.teamSlug,
      username: input.username,
    });
    return castToDeclaredGithubTeamMembership({
      data: response.data,
      org: input.org,
      teamSlug: input.teamSlug,
      username: input.username,
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: return null if membership not found
    if (isGithubNotFoundError({ error })) return null;

    throw new MalfunctionError('github.getTeamMembership error', {
      cause: error,
      org: input.org,
      teamSlug: input.teamSlug,
      username: input.username,
    });
  }
};

/**
 * .what = gets a user's membership in a GitHub Team
 * .why = retrieves current membership state for declarative management
 */
export const getOneTeamMembership = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubTeamMembership>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubTeamMembership> | null> => {
    // extract membership details from input
    const { org, teamSlug, username } =
      extractMembershipDetailsFromUniqueRef(input);

    // fetch membership from GitHub
    return getMembershipFromGithubOrNull({ org, teamSlug, username }, context);
  },
);
