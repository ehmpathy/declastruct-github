import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref } from 'domain-objects';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';

import { isGithubNotFoundError } from '../_utils/isGithubNotFoundError';

/**
 * .what = type guard for DeclaredGithubTeam unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isTeamRefByUnique = isRefByUnique({ of: DeclaredGithubTeam });

/**
 * .what = extracts org and slug from team ref
 * .why = validates and transforms generic ref to typed unique key
 */
const extractOrgAndSlugFromRef = (input: {
  ref: Ref<typeof DeclaredGithubTeam> | undefined;
}): { org: { login: string }; slug: string } => {
  if (!input.ref)
    UnexpectedCodePathError.throw('no valid reference provided', {
      input,
    });

  // must be a unique key ref (org + slug)
  if (!isTeamRefByUnique(input.ref))
    UnexpectedCodePathError.throw(
      'delTeam requires unique key ref (org + slug)',
      { input },
    );

  return input.ref as {
    org: { login: string };
    slug: string;
  };
};

/**
 * .what = deletes team from GitHub, no-op if not found
 * .why = communicator that handles GitHub 404 responses as no-op for idempotency
 */
const deleteTeamFromGithubIdempotent = async (
  input: { org: string; slug: string },
  context: ContextGithubApi & VisualogicContext,
): Promise<void> => {
  const github = getGithubClient({}, context);

  try {
    await github.teams.deleteInOrg({
      org: input.org,
      team_slug: input.slug,
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // idempotent: no error if not found
    if (isGithubNotFoundError({ error })) return;

    throw new MalfunctionError('github.deleteTeam error', {
      cause: error,
      org: input.org,
      slug: input.slug,
    });
  }
};

/**
 * .what = deletes a GitHub Team
 * .why = enables declarative management of teams
 * .note = idempotent: no error if team does not exist
 */
export const delTeam = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubTeam>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<void> => {
    // extract org and slug from ref
    const { org, slug } = extractOrgAndSlugFromRef({ ref: input.by.ref });

    // delete team from GitHub
    await deleteTeamFromGithubIdempotent({ org: org.login, slug }, context);
  },
);
