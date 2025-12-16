import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgMemberPrivileges } from '@src/domain.objects/DeclaredGithubOrgMemberPrivileges';

import * as castModule from './castToDeclaredGithubOrgMemberPrivileges';
import * as getModule from './getOneOrgMemberPrivileges';

const mockOrgsUpdate = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    orgs: { update: mockOrgsUpdate },
  })),
}));

jest.mock('./castToDeclaredGithubOrgMemberPrivileges');
jest.mock('./getOneOrgMemberPrivileges');

const { setOrgMemberPrivileges } = require('./setOrgMemberPrivileges');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

const privilegesSample: DeclaredGithubOrgMemberPrivileges = {
  org,
  membersCanCreateRepositories: true,
  membersCanCreatePublicRepositories: true,
  membersCanCreatePrivateRepositories: true,
  membersCanCreateInternalRepositories: false,
  membersCanDeleteRepositories: false,
  membersCanChangeRepoVisibility: false,
  membersCanForkPrivateRepositories: false,
  membersCanInviteOutsideCollaborators: true,
  membersCanCreatePages: true,
  membersCanCreatePublicPages: true,
  membersCanCreatePrivatePages: false,
  defaultRepositoryPermission: 'read',
};

describe('setOrgMemberPrivileges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a finsert operation', () => {
    when('the privileges already exist', () => {
      then('it should return the existing privileges', async () => {
        const before = { ...privilegesSample };
        (getModule.getOneOrgMemberPrivileges as jest.Mock).mockResolvedValue(
          before,
        );

        const result = await setOrgMemberPrivileges(
          { finsert: privilegesSample },
          context,
        );

        expect(result).toBe(before);
        expect(mockOrgsUpdate).not.toHaveBeenCalled();
      });
    });

    when('the org does not exist', () => {
      then('it should throw an error', async () => {
        (getModule.getOneOrgMemberPrivileges as jest.Mock).mockResolvedValue(
          null,
        );

        await expect(
          setOrgMemberPrivileges({ finsert: privilegesSample }, context),
        ).rejects.toThrow('GitHub Organization does not exist');
      });
    });
  });

  given('an upsert operation', () => {
    when('the org exists', () => {
      then('it should update the privileges', async () => {
        const before = { ...privilegesSample };
        const updated = {
          ...privilegesSample,
          membersCanDeleteRepositories: true,
        };

        (getModule.getOneOrgMemberPrivileges as jest.Mock).mockResolvedValue(
          before,
        );
        mockOrgsUpdate.mockResolvedValue({ data: {} });
        (
          castModule.castToDeclaredGithubOrgMemberPrivileges as jest.Mock
        ).mockReturnValue(updated);

        const result = await setOrgMemberPrivileges(
          { upsert: privilegesSample },
          context,
        );

        expect(mockOrgsUpdate).toHaveBeenCalledWith({
          org: 'test-org',
          members_can_create_repositories: true,
          members_can_create_public_repositories: true,
          members_can_create_private_repositories: true,
          members_can_create_internal_repositories: false,
          members_can_fork_private_repositories: false,
          members_can_create_pages: true,
          members_can_create_public_pages: true,
          members_can_create_private_pages: false,
          default_repository_permission: 'read',
        });
        expect(result).toEqual(updated);
      });
    });
  });
});
