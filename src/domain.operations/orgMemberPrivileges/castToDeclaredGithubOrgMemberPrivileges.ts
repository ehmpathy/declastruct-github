import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import type { RefByUnique } from 'domain-objects';
import type { HasMetadata } from 'type-fns';

import type { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
import { DeclaredGithubOrgMemberPrivileges } from '@src/domain.objects/DeclaredGithubOrgMemberPrivileges';

type GithubOrgResponse = Endpoints['GET /orgs/{org}']['response']['data'];

/**
 * .what = casts GitHub API org response to DeclaredGithubOrgMemberPrivileges
 * .why = extracts member privilege fields from org API response
 */
export const castToDeclaredGithubOrgMemberPrivileges = (input: {
  data: GithubOrgResponse;
  org: RefByUnique<typeof DeclaredGithubOrg>;
}): HasMetadata<DeclaredGithubOrgMemberPrivileges> => {
  return DeclaredGithubOrgMemberPrivileges.as({
    org: input.org,
    updatedAt: input.data.updated_at
      ? asUniDateTime(input.data.updated_at)
      : undefined,

    // Repository creation
    membersCanCreateRepositories:
      input.data.members_can_create_repositories ?? true,
    membersCanCreatePublicRepositories:
      input.data.members_can_create_public_repositories ?? true,
    membersCanCreatePrivateRepositories:
      input.data.members_can_create_private_repositories ?? true,
    membersCanCreateInternalRepositories: (() => {
      // internal repos only available for enterprise orgs
      const isEnterprise = input.data.plan?.name
        ?.toLowerCase()
        .includes('enterprise');
      if (!isEnterprise) return null;
      return input.data.members_can_create_internal_repositories ?? null;
    })(),

    // Repository management (KEY SECURITY)
    membersCanDeleteRepositories:
      // Note: GitHub API uses 'members_can_delete_repositories' field
      ((input.data as Record<string, unknown>)
        .members_can_delete_repositories as boolean) ?? true,
    membersCanChangeRepoVisibility:
      ((input.data as Record<string, unknown>)
        .members_can_change_repo_visibility as boolean) ?? true,
    membersCanForkPrivateRepositories:
      input.data.members_can_fork_private_repositories ?? false,

    // Collaboration
    membersCanInviteOutsideCollaborators: true, // Not directly exposed in API

    // GitHub Pages
    membersCanCreatePages: input.data.members_can_create_pages ?? true,
    membersCanCreatePublicPages:
      input.data.members_can_create_public_pages ?? true,
    membersCanCreatePrivatePages:
      input.data.members_can_create_private_pages ?? true,

    defaultRepositoryPermission:
      (input.data.default_repository_permission as
        | 'read'
        | 'write'
        | 'admin'
        | 'none') ?? 'read',
  }) as HasMetadata<DeclaredGithubOrgMemberPrivileges>;
};
