import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import * as castModule from './castToDeclaredGithubOrg';

const mockOrgsGet = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    orgs: { get: mockOrgsGet },
  })),
}));

jest.mock('./castToDeclaredGithubOrg');

const { getOneOrg } = require('./getOneOrg');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

describe('getOneOrg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a by.unique reference', () => {
    when('the org exists', () => {
      then('it should return the org', async () => {
        const apiResponse = {
          id: 12345,
          login: 'test-org',
          name: 'Test Organization',
        };
        const castedOrg = { id: 12345, login: 'test-org' };

        mockOrgsGet.mockResolvedValue({ data: apiResponse });
        (castModule.castToDeclaredGithubOrg as jest.Mock).mockReturnValue(
          castedOrg,
        );

        const result = await getOneOrg(
          { by: { unique: { login: 'test-org' } } },
          context,
        );

        expect(mockOrgsGet).toHaveBeenCalledWith({ org: 'test-org' });
        expect(result).toEqual(castedOrg);
      });
    });

    when('the org does not exist', () => {
      then('it should return null', async () => {
        mockOrgsGet.mockRejectedValue(new Error('Not Found'));

        const result = await getOneOrg(
          { by: { unique: { login: 'nonexistent-org' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockOrgsGet.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(
          getOneOrg({ by: { unique: { login: 'test-org' } } }, context),
        ).rejects.toThrow('github.getOrg error');
      });
    });
  });
});
