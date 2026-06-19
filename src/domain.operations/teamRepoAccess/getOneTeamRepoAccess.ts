import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeamRepoAccess } from '@src/domain.objects/DeclaredGithubTeamRepoAccess';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';
import { castToDeclaredGithubTeamRepoAccess } from './castToDeclaredGithubTeamRepoAccess';

/**
 * .what = extracts org, team slug, repo owner, and repo name from access unique ref
 * .why = validates and transforms generic input to typed unique key
 */
const extractAccessDetailsFromUniqueRef = (input: {
  by: PickOne<{ unique: RefByUnique<typeof DeclaredGithubTeamRepoAccess> }>;
}): { org: string; teamSlug: string; repoOwner: string; repoName: string } => {
  // validate unique ref provided
  if (!input.by.unique) {
    UnexpectedCodePathError.throw('not referenced by unique', { input });
  }

  return {
    org: input.by.unique.team.org.login,
    teamSlug: input.by.unique.team.slug,
    repoOwner: input.by.unique.repo.owner,
    repoName: input.by.unique.repo.name,
  };
};

/**
 * .what = fetches team repo access from GitHub API, returns null if not found
 * .why = communicator that handles GitHub 404 responses as null for idempotency
 */
const getAccessFromGithubOrNull = async (
  input: { org: string; teamSlug: string; repoOwner: string; repoName: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<HasMetadata<DeclaredGithubTeamRepoAccess> | null> => {
  const github = getGithubClient({}, context);

  try {
    const response = await github.teams.checkPermissionsForRepoInOrg({
      org: input.org,
      team_slug: input.teamSlug,
      owner: input.repoOwner,
      repo: input.repoName,
    });
    return castToDeclaredGithubTeamRepoAccess({
      data: response.data,
      org: input.org,
      teamSlug: input.teamSlug,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: return null if access not found
    if (isGithubNotFoundError({ error })) return null;

    throw new MalfunctionError('github.getTeamRepoAccess error', {
      cause: error,
      org: input.org,
      teamSlug: input.teamSlug,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
    });
  }
};

/**
 * .what = gets a team's access to a GitHub repository
 * .why = retrieves current access state for declarative management
 */
export const getOneTeamRepoAccess = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubTeamRepoAccess>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubTeamRepoAccess> | null> => {
    // extract access details from input
    const { org, teamSlug, repoOwner, repoName } =
      extractAccessDetailsFromUniqueRef(input);

    // fetch access from GitHub
    return getAccessFromGithubOrNull(
      { org, teamSlug, repoOwner, repoName },
      context,
    );
  },
);
