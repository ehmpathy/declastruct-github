import { asProcedure } from 'as-procedure';
import { MalfunctionError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { ContextLogTrail } from 'sdk-logs';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';

import { castToDeclaredGithubTeamMembership } from './castToDeclaredGithubTeamMembership';
import { getOneTeamMembership } from './getOneTeamMembership';

/**
 * .what = extracts the desired membership from findsert/upsert input
 * .why = avoids inline decode-friction in orchestrator
 */
const asDesiredMembership = (input: {
  findsert?: DeclaredGithubTeamMembership;
  upsert?: DeclaredGithubTeamMembership;
}): DeclaredGithubTeamMembership => {
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
  before: HasMetadata<DeclaredGithubTeamMembership> | null;
  isFindsert: boolean;
}): boolean => {
  return input.before !== null && input.isFindsert;
};

/**
 * .what = adds or updates membership in GitHub
 * .why = communicator for membership upsert operation
 */
const upsertMembershipInGithub = async (
  input: {
    org: string;
    teamSlug: string;
    username: string;
    role: 'member' | 'maintainer';
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<HasMetadata<DeclaredGithubTeamMembership>> => {
  const github = getGithubClient({}, context);
  return MalfunctionError.wrap(
    async () => {
      const response = await github.teams.addOrUpdateMembershipForUserInOrg({
        org: input.org,
        team_slug: input.teamSlug,
        username: input.username,
        role: input.role,
      });
      return castToDeclaredGithubTeamMembership({
        data: response.data,
        org: input.org,
        teamSlug: input.teamSlug,
        username: input.username,
      });
    },
    {
      message: 'github.setTeamMembership error',
      metadata: {
        org: input.org,
        teamSlug: input.teamSlug,
        username: input.username,
      },
    },
  )();
};

/**
 * .what = adds or updates a user's membership in a GitHub Team
 * .why = enables declarative management of team membership
 */
export const setTeamMembership = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubTeamMembership;
      upsert: DeclaredGithubTeamMembership;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubTeamMembership>> => {
    const desired = asDesiredMembership(input);
    const org = desired.team.org.login;
    const teamSlug = desired.team.slug;
    const username = desired.username;

    // check if membership exists
    const before = await getOneTeamMembership(
      {
        by: {
          unique: {
            team: { org: { login: org }, slug: teamSlug },
            username,
          },
        },
      },
      context,
    );

    // if findsert and found, return as-is (do not update role)
    if (shouldReturnExtant({ before, isFindsert: !!input.findsert }))
      return before!;

    // add or update membership
    return upsertMembershipInGithub(
      { org, teamSlug, username, role: desired.role },
      context,
    );
  },
);
