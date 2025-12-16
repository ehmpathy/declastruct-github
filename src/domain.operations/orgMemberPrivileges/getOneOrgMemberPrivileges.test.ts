import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import * as castModule from './castToDeclaredGithubOrgMemberPrivileges';

const mockOrgsGet = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    orgs: { get: mockOrgsGet },
  })),
}));

jest.mock('./castToDeclaredGithubOrgMemberPrivileges');

const { getOneOrgMemberPrivileges } = require('./getOneOrgMemberPrivileges');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('getOneOrgMemberPrivileges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a by.unique reference', () => {
    when('the org exists', () => {
      then('it should return the member privileges', async () => {
        const apiResponse = {
          members_can_create_repositories: true,
          members_can_delete_repositories: false,
        };
        const castedPrivileges = {
          org,
          membersCanCreateRepositories: true,
          membersCanDeleteRepositories: false,
        };

        mockOrgsGet.mockResolvedValue({ data: apiResponse });
        (
          castModule.castToDeclaredGithubOrgMemberPrivileges as jest.Mock
        ).mockReturnValue(castedPrivileges);

        const result = await getOneOrgMemberPrivileges(
          { by: { unique: { org } } },
          context,
        );

        expect(mockOrgsGet).toHaveBeenCalledWith({ org: 'test-org' });
        expect(result).toEqual(castedPrivileges);
      });
    });

    when('the org does not exist', () => {
      then('it should return null', async () => {
        mockOrgsGet.mockRejectedValue(new Error('Not Found'));

        const result = await getOneOrgMemberPrivileges(
          { by: { unique: { org } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockOrgsGet.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(
          getOneOrgMemberPrivileges({ by: { unique: { org } } }, context),
        ).rejects.toThrow('github.getOrgMemberPrivileges error');
      });
    });
  });
});
