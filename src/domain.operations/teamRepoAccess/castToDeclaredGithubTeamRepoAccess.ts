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
 * .note = github API returns 'read'/'write' but we use 'pull'/'push' to match
 *         the permission names used in addOrUpdateRepoPermissionsInOrg
 */
const asPermission = (input: {
  roleName: string;
}): DeclaredGithubTeamRepoAccess['permission'] => {
  // map github api role names to our domain permission names
  const roleNameMap: Record<
    string,
    DeclaredGithubTeamRepoAccess['permission']
  > = {
    read: 'pull',
    write: 'push',
    triage: 'triage',
    maintain: 'maintain',
    admin: 'admin',
    // also accept our domain names directly (for consistency)
    pull: 'pull',
    push: 'push',
  };

  const permission = roleNameMap[input.roleName];
  if (permission) return permission;

  // failfast on unrecognized permission
  return UnexpectedCodePathError.throw('unrecognized permission role_name', {
    roleName: input.roleName,
    validRoleNames: Object.keys(roleNameMap),
  });
};
