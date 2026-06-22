import { asProcedure } from 'as-procedure';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeamRepoAccess } from '@src/domain.objects/DeclaredGithubTeamRepoAccess';

import { getOneTeamRepoAccess } from './getOneTeamRepoAccess';

/**
 * .what = extracts the desired access from findsert/upsert input
 * .why = avoids inline decode-friction in orchestrator
 */
const asDesiredAccess = (input: {
  findsert?: DeclaredGithubTeamRepoAccess;
  upsert?: DeclaredGithubTeamRepoAccess;
}): DeclaredGithubTeamRepoAccess => {
  const desired = input.findsert ?? input.upsert;
  if (!desired)
    UnexpectedCodePathError.throw(
      'expected findsert or upsert to be provided',
      { input },
    );
  return desired;
};

/**
 * .what = determines if extant should be returned for findsert
 * .why = encapsulates findsert semantics in named transformer
 */
const shouldReturnExtant = (input: {
  before: HasMetadata<DeclaredGithubTeamRepoAccess> | null;
  isFindsert: boolean;
}): boolean => {
  return input.before !== null && input.isFindsert;
};

/**
 * .what = adds or updates team repo access in GitHub
 * .why = communicator for access upsert operation
 * .note = reads after write to confirm actual state (PUT returns 204 No Content)
 */
const upsertAccessInGithub = async (
  input: {
    org: string;
    teamSlug: string;
    repoOwner: string;
    repoName: string;
    permission: DeclaredGithubTeamRepoAccess['permission'];
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<HasMetadata<DeclaredGithubTeamRepoAccess>> => {
  const github = getGithubClient({}, context);

  // write: PUT returns 204 No Content
  await MalfunctionError.wrap(
    async () =>
      github.teams.addOrUpdateRepoPermissionsInOrg({
        org: input.org,
        team_slug: input.teamSlug,
        owner: input.repoOwner,
        repo: input.repoName,
        permission: input.permission,
      }),
    {
      message: 'github.setTeamRepoAccess error',
      metadata: {
        org: input.org,
        teamSlug: input.teamSlug,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
      },
    },
  )();

  // read: verify actual state
  const after = await getOneTeamRepoAccess(
    {
      by: {
        unique: {
          team: { org: { login: input.org }, slug: input.teamSlug },
          repo: { owner: input.repoOwner, name: input.repoName },
        },
      },
    },
    context,
  );

  // failfast if write did not persist
  if (!after)
    UnexpectedCodePathError.throw(
      'read-after-write failed: access not found after upsert',
      { input },
    );

  // failfast if permission does not match
  if (after.permission !== input.permission)
    UnexpectedCodePathError.throw(
      'read-after-write mismatch: permission differs from requested',
      { requested: input.permission, actual: after.permission },
    );

  return after;
};

/**
 * .what = adds or updates a team's access to a GitHub repository
 * .why = enables declarative management of team repo access
 */
export const setTeamRepoAccess = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubTeamRepoAccess;
      upsert: DeclaredGithubTeamRepoAccess;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubTeamRepoAccess>> => {
    const desired = asDesiredAccess(input);
    const org = desired.team.org.login;
    const teamSlug = desired.team.slug;
    const repoOwner = desired.repo.owner;
    const repoName = desired.repo.name;

    // check if access exists
    const before = await getOneTeamRepoAccess(
      {
        by: {
          unique: {
            team: { org: { login: org }, slug: teamSlug },
            repo: { owner: repoOwner, name: repoName },
          },
        },
      },
      context,
    );

    // if findsert and found, return as-is (do not update permission)
    if (shouldReturnExtant({ before, isFindsert: !!input.findsert }))
      return before!;

    // add or update access
    return upsertAccessInGithub(
      { org, teamSlug, repoOwner, repoName, permission: desired.permission },
      context,
    );
  },
);
