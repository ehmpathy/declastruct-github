import { given, then, when } from 'test-fns';

import { DeclaredGithubOrgMemberPrivileges } from '@src/domain.objects/DeclaredGithubOrgMemberPrivileges';

import { castToDeclaredGithubOrgMemberPrivileges } from './castToDeclaredGithubOrgMemberPrivileges';

describe('castToDeclaredGithubOrgMemberPrivileges', () => {
  given('a GitHub API org response with member privileges', () => {
    const org = { login: 'test-org' };

    when('all privilege fields are present', () => {
      const data = {
        updated_at: '2024-01-01T00:00:00Z',
        members_can_create_repositories: true,
        members_can_create_public_repositories: true,
        members_can_create_private_repositories: true,
        members_can_create_internal_repositories: false,
        members_can_delete_repositories: false,
        members_can_change_repo_visibility: false,
        members_can_fork_private_repositories: true,
        members_can_create_pages: true,
        members_can_create_public_pages: true,
        members_can_create_private_pages: false,
        dependency_graph_enabled_for_new_repositories: true,
        default_repository_permission: 'read',
      };

      then('it should cast to DeclaredGithubOrgMemberPrivileges', () => {
        const result = castToDeclaredGithubOrgMemberPrivileges({
          data: data as any,
          org,
        });

        expect(result).toBeInstanceOf(DeclaredGithubOrgMemberPrivileges);
        expect(result.org).toEqual(org);
        expect(result.membersCanCreateRepositories).toEqual(true);
        expect(result.membersCanCreatePublicRepositories).toEqual(true);
        expect(result.membersCanCreatePrivateRepositories).toEqual(true);
        expect(result.membersCanCreateInternalRepositories).toEqual(null); // null for non-enterprise
        expect(result.membersCanDeleteRepositories).toEqual(false);
        expect(result.membersCanChangeRepoVisibility).toEqual(false);
        expect(result.membersCanForkPrivateRepositories).toEqual(true);
        expect(result.membersCanCreatePages).toEqual(true);
        expect(result.membersCanCreatePublicPages).toEqual(true);
        expect(result.membersCanCreatePrivatePages).toEqual(false);
        expect(result.defaultRepositoryPermission).toEqual('read');
      });
    });

    when('privilege fields use GitHub defaults (missing)', () => {
      const data = {
        updated_at: null,
      };

      then('it should use safe defaults', () => {
        const result = castToDeclaredGithubOrgMemberPrivileges({
          data: data as any,
          org,
        });

        expect(result.membersCanCreateRepositories).toEqual(true);
        expect(result.membersCanDeleteRepositories).toEqual(true);
        expect(result.membersCanChangeRepoVisibility).toEqual(true);
        expect(result.defaultRepositoryPermission).toEqual('read');
      });
    });
  });
});
