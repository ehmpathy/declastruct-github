import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeamRepoAccess } from '@src/domain.objects/DeclaredGithubTeamRepoAccess';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';

/**
 * .what = type guard for DeclaredGithubTeamRepoAccess unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isAccessRefByUnique = isRefByUnique({
  of: DeclaredGithubTeamRepoAccess,
});

/**
 * .what = extracts team and repo from access ref
 * .why = validates and transforms generic ref to typed unique key
 */
const extractTeamAndRepoFromRef = (input: {
  ref: Ref<typeof DeclaredGithubTeamRepoAccess> | undefined;
}): {
  team: { org: { login: string }; slug: string };
  repo: { owner: string; name: string };
} => {
  if (!input.ref)
    UnexpectedCodePathError.throw('no valid reference provided', {
      input,
    });

  // must be a unique key ref (team + repo)
  if (!isAccessRefByUnique(input.ref))
    UnexpectedCodePathError.throw(
      'delTeamRepoAccess requires unique key ref (team + repo)',
      { input },
    );

  return input.ref as {
    team: { org: { login: string }; slug: string };
    repo: { owner: string; name: string };
  };
};

/**
 * .what = removes access from GitHub, no-op if not found
 * .why = communicator that handles GitHub 404 responses as no-op for idempotency
 */
const deleteAccessFromGithubIdempotent = async (
  input: { org: string; teamSlug: string; repoOwner: string; repoName: string },
  context: ContextGithubApi & ContextLogTrail,
): Promise<void> => {
  const github = getGithubClient({}, context);

  try {
    await github.teams.removeRepoInOrg({
      org: input.org,
      team_slug: input.teamSlug,
      owner: input.repoOwner,
      repo: input.repoName,
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: no error if not found
    if (isGithubNotFoundError({ error })) return;

    throw new MalfunctionError('github.removeTeamRepoAccess error', {
      cause: error,
      org: input.org,
      teamSlug: input.teamSlug,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
    });
  }
};

/**
 * .what = removes a team's access to a GitHub repository
 * .why = enables declarative management of team repo access
 * .note = idempotent: no error if access does not exist
 */
export const delTeamRepoAccess = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubTeamRepoAccess>;
      }>;
    },
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<void> => {
    // extract team and repo from ref
    const { team, repo } = extractTeamAndRepoFromRef({
      ref: input.by.ref,
    });

    // delete access from GitHub
    await deleteAccessFromGithubIdempotent(
      {
        org: team.org.login,
        teamSlug: team.slug,
        repoOwner: repo.owner,
        repoName: repo.name,
      },
      context,
    );
  },
);
