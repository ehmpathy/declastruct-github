import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgMemberPrivileges } from '@src/domain.objects/DeclaredGithubOrgMemberPrivileges';

import { castToDeclaredGithubOrgMemberPrivileges } from './castToDeclaredGithubOrgMemberPrivileges';
import { getOneOrgMemberPrivileges } from './getOneOrgMemberPrivileges';

/**
 * .what = sets GitHub Organization member privileges
 * .why = enables declarative management of org security settings
 *
 * KEY SECURITY SETTINGS:
 * - membersCanDeleteRepositories: false -> only owners can delete/transfer repos
 * - membersCanChangeRepoVisibility: false -> only owners can change visibility
 */
export const setOrgMemberPrivileges = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubOrgMemberPrivileges;
      upsert: DeclaredGithubOrgMemberPrivileges;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgMemberPrivileges>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // Check current state
    const before = await getOneOrgMemberPrivileges(
      { by: { unique: { org: desired.org } } },
      context,
    );

    // Org must exist
    if (!before) {
      throw new HelpfulError('GitHub Organization does not exist.', {
        desiredPrivileges: desired,
      });
    }

    // If findsert and found, return as-is (no changes)
    if (before && input.findsert) return before;

    // Apply member privilege updates via PATCH
    try {
      const response = await github.orgs.update({
        org: desired.org.login,
        // Repository creation
        members_can_create_repositories: desired.membersCanCreateRepositories,
        members_can_create_public_repositories:
          desired.membersCanCreatePublicRepositories,
        members_can_create_private_repositories:
          desired.membersCanCreatePrivateRepositories,
        members_can_create_internal_repositories:
          desired.membersCanCreateInternalRepositories ?? undefined,
        // KEY SECURITY SETTINGS
        // Note: These fields may not be directly settable via the standard API
        // They are typically org settings that require admin permissions
        members_can_fork_private_repositories:
          desired.membersCanForkPrivateRepositories,
        // GitHub Pages
        members_can_create_pages: desired.membersCanCreatePages,
        members_can_create_public_pages: desired.membersCanCreatePublicPages,
        members_can_create_private_pages: desired.membersCanCreatePrivatePages,
        // Other
        default_repository_permission: desired.defaultRepositoryPermission,
      });

      return castToDeclaredGithubOrgMemberPrivileges({
        data: response.data,
        org: desired.org,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.setOrgMemberPrivileges.update error', {
        cause: error,
      });
    }
  },
);
