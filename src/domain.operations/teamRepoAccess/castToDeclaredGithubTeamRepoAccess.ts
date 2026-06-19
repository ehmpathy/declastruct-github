import type { Endpoints } from '@octokit/types';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubTeamRepoAccess } from '@src/domain.objects/DeclaredGithubTeamRepoAccess';

type GithubTeamRepoResponse =
  Endpoints['GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}']['response']['data'];

/**
 * .what = casts GitHub API team repo access response to DeclaredGithubTeamRepoAccess
 * .why = transforms external API shape to our domain model with type safety
 */
export const castToDeclaredGithubTeamRepoAccess = (input: {
  data: GithubTeamRepoResponse;
  org: string;
  teamSlug: string;
  repoOwner: string;
  repoName: string;
}): HasMetadata<DeclaredGithubTeamRepoAccess> => {
  // extract permission from response data
  const permission = input.data.role_name
    ? asPermission({ roleName: input.data.role_name })
    : UnexpectedCodePathError.throw('role_name absent in response data', {
        input,
      });

  return DeclaredGithubTeamRepoAccess.as({
    team: {
      org: { login: input.org },
      slug: input.teamSlug,
    },
    repo: { owner: input.repoOwner, name: input.repoName },
    permission,
  }) as HasMetadata<DeclaredGithubTeamRepoAccess>;
};

/**
 * .what = converts GitHub role_name to domain permission type
 * .why = maps external API values to our domain type with failfast on unrecognized
 */
const asPermission = (input: {
  roleName: string;
}): DeclaredGithubTeamRepoAccess['permission'] => {
  const validPermissions = ['pull', 'push', 'triage', 'maintain', 'admin'];
  if (validPermissions.includes(input.roleName))
    return input.roleName as DeclaredGithubTeamRepoAccess['permission'];

  // failfast on unrecognized permission
  return UnexpectedCodePathError.throw('unrecognized permission role_name', {
    roleName: input.roleName,
    validPermissions,
  });
};
