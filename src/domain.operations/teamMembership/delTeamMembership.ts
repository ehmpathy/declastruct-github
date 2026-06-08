import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';

/**
 * .what = type guard for DeclaredGithubTeamMembership unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isMembershipRefByUnique = isRefByUnique({
  of: DeclaredGithubTeamMembership,
});

/**
 * .what = extracts team and username from membership ref
 * .why = validates and transforms generic ref to typed unique key
 */
const extractTeamAndUsernameFromRef = (input: {
  ref: Ref<typeof DeclaredGithubTeamMembership> | undefined;
}): {
  team: { org: { login: string }; slug: string };
  username: string;
} => {
  if (!input.ref)
    UnexpectedCodePathError.throw('no valid reference provided', {
      input,
    });

  // must be a unique key ref (team + username)
  if (!isMembershipRefByUnique(input.ref))
    UnexpectedCodePathError.throw(
      'delTeamMembership requires unique key ref (team + username)',
      { input },
    );

  return input.ref as {
    team: { org: { login: string }; slug: string };
    username: string;
  };
};

/**
 * .what = removes membership from GitHub, no-op if not found
 * .why = communicator that handles GitHub 404 responses as no-op for idempotency
 */
const deleteMembershipFromGithubIdempotent = async (
  input: { org: string; teamSlug: string; username: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<void> => {
  const github = getGithubClient({}, context);

  try {
    await github.teams.removeMembershipForUserInOrg({
      org: input.org,
      team_slug: input.teamSlug,
      username: input.username,
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: no error if not found
    if (isGithubNotFoundError({ error })) return;

    throw new MalfunctionError('github.removeTeamMembership error', {
      cause: error,
      org: input.org,
      teamSlug: input.teamSlug,
      username: input.username,
    });
  }
};

/**
 * .what = removes a user's membership from a GitHub Team
 * .why = enables declarative management of team membership
 * .note = idempotent: no error if membership does not exist
 */
export const delTeamMembership = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubTeamMembership>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<void> => {
    // extract team and username from ref
    const { team, username } = extractTeamAndUsernameFromRef({
      ref: input.by.ref,
    });

    // delete membership from GitHub
    await deleteMembershipFromGithubIdempotent(
      { org: team.org.login, teamSlug: team.slug, username },
      context,
    );
  },
);
