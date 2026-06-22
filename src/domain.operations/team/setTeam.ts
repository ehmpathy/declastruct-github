import { asProcedure } from 'as-procedure';
import {
  BadRequestError,
  MalfunctionError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';

import { castToDeclaredGithubTeam } from './castToDeclaredGithubTeam';
import { getOneTeam } from './getOneTeam';

/**
 * .what = extracts the desired team from findsert/upsert input
 * .why = avoids inline decode-friction in orchestrator
 */
const asDesiredTeam = (input: {
  findsert?: DeclaredGithubTeam;
  upsert?: DeclaredGithubTeam;
}): DeclaredGithubTeam => {
  const desired = input.findsert ?? input.upsert;
  if (!desired)
    UnexpectedCodePathError.throw(
      'expected findsert or upsert to be provided',
      { input },
    );
  return desired;
};

/**
 * .what = maps domain notification value to GitHub API value
 * .why = avoids inline decode-friction in orchestrator
 */
const asGithubTeamNotifyValue = (input: {
  notifications: 'enabled' | 'disabled';
}): 'notifications_enabled' | 'notifications_disabled' => {
  return input.notifications === 'enabled'
    ? 'notifications_enabled'
    : 'notifications_disabled';
};

/**
 * .what = looks up optional parent team ID or returns undefined
 * .why = avoids inline decode-friction in orchestrator
 */
const asParentTeamIdOrUndefined = async (
  input: { parent: { slug: string } | null; org: string },
  context: ContextGithubApi & ContextLogTrail,
): Promise<number | undefined> => {
  if (!input.parent) return undefined;
  return getParentTeamId({ org: input.org, slug: input.parent.slug }, context);
};

/**
 * .what = determines if extant should be returned for findsert
 * .why = encapsulates findsert semantics in named transformer
 */
const shouldReturnExtant = (input: {
  before: HasMetadata<DeclaredGithubTeam> | null;
  isFindsert: boolean;
}): boolean => {
  return input.before !== null && input.isFindsert;
};

/**
 * .what = updates a team in GitHub
 * .why = communicator for team update operation
 */
const updateTeamInGithub = async (
  input: {
    org: string;
    slug: string;
    name: string;
    description: string | null;
    privacy: 'closed' | 'secret';
    notifyValue: 'notifications_enabled' | 'notifications_disabled';
    parentTeamId: number | undefined;
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<HasMetadata<DeclaredGithubTeam>> => {
  const github = getGithubClient({}, context);
  return MalfunctionError.wrap(
    async () => {
      const response = await github.teams.updateInOrg({
        org: input.org,
        team_slug: input.slug,
        name: input.name,
        description: input.description ?? undefined,
        privacy: input.privacy,
        notification_setting: input.notifyValue,
        parent_team_id: input.parentTeamId,
      });
      return castToDeclaredGithubTeam({ data: response.data, org: input.org });
    },
    {
      message: 'github.setTeam.update error',
      metadata: { org: input.org, slug: input.slug },
    },
  )();
};

/**
 * .what = creates a team in GitHub
 * .why = communicator for team create operation
 */
const createTeamInGithub = async (
  input: {
    org: string;
    name: string;
    description: string | null;
    privacy: 'closed' | 'secret';
    notifyValue: 'notifications_enabled' | 'notifications_disabled';
    parentTeamId: number | undefined;
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<HasMetadata<DeclaredGithubTeam>> => {
  const github = getGithubClient({}, context);
  return MalfunctionError.wrap(
    async () => {
      const response = await github.teams.create({
        org: input.org,
        name: input.name,
        description: input.description ?? undefined,
        privacy: input.privacy,
        notification_setting: input.notifyValue,
        parent_team_id: input.parentTeamId,
      });
      return castToDeclaredGithubTeam({ data: response.data, org: input.org });
    },
    {
      message: 'github.setTeam.create error',
      metadata: { org: input.org, name: input.name },
    },
  )();
};

/**
 * .what = creates or updates a GitHub Team
 * .why = enables declarative management of teams
 */
export const setTeam = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubTeam;
      upsert: DeclaredGithubTeam;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubTeam>> => {
    const desired = asDesiredTeam(input);
    const org = desired.org.login;

    // check if team exists
    const before = await getOneTeam(
      { by: { unique: { org: { login: org }, slug: desired.slug } } },
      context,
    );

    // if findsert and found, return as-is
    if (shouldReturnExtant({ before, isFindsert: !!input.findsert }))
      return before!;

    // compute common values
    const notifyValue = asGithubTeamNotifyValue({
      notifications: desired.notifications,
    });
    const parentTeamId = await asParentTeamIdOrUndefined(
      { parent: desired.parent, org },
      context,
    );

    // if found, update; otherwise create
    if (before) {
      return updateTeamInGithub(
        {
          org,
          slug: desired.slug,
          name: desired.name,
          description: desired.description,
          privacy: desired.privacy,
          notifyValue,
          parentTeamId,
        },
        context,
      );
    }
    return createTeamInGithub(
      {
        org,
        name: desired.name,
        description: desired.description,
        privacy: desired.privacy,
        notifyValue,
        parentTeamId,
      },
      context,
    );
  },
);

/**
 * .what = looks up parent team ID by slug
 * .why = GitHub API requires numeric ID for parent_team_id
 */
const getParentTeamId = async (
  input: { org: string; slug: string },
  context: ContextGithubApi & ContextLogTrail,
): Promise<number> => {
  const parent = await getOneTeam(
    { by: { unique: { org: { login: input.org }, slug: input.slug } } },
    context,
  );
  // validate parent team exists
  if (!parent || !parent.id) {
    throw new BadRequestError('parent team not found', {
      org: input.org,
      slug: input.slug,
      hint: 'ensure parent team exists before child team creation',
    });
  }
  return parent.id;
};
