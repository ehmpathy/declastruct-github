import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

import * as castModule from './castToDeclaredGithubOrgSecret';

const mockGetOrgSecret = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { getOrgSecret: mockGetOrgSecret },
  })),
}));

jest.mock('./castToDeclaredGithubOrgSecret');

const { getOneOrgSecret } = require('./getOneOrgSecret');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('getOneOrgSecret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a by.unique reference', () => {
    when('the secret exists', () => {
      then(
        'it should return the secret metadata (value undefined)',
        async () => {
          const apiResponse = {
            name: 'TEST_SECRET',
            visibility: 'private',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          };
          const castedSecret = {
            org,
            name: 'TEST_SECRET',
            value: undefined,
            visibility: 'private',
          };

          mockGetOrgSecret.mockResolvedValue({ data: apiResponse });
          (
            castModule.castToDeclaredGithubOrgSecret as jest.Mock
          ).mockReturnValue(castedSecret);

          const result = await getOneOrgSecret(
            { by: { unique: { org, name: 'TEST_SECRET' } } },
            context,
          );

          expect(mockGetOrgSecret).toHaveBeenCalledWith({
            org: 'test-org',
            secret_name: 'TEST_SECRET',
          });
          expect(result).toEqual(castedSecret);
          expect(result.value).toBeUndefined();
        },
      );
    });

    when('the secret does not exist', () => {
      then('it should return null', async () => {
        mockGetOrgSecret.mockRejectedValue(new Error('Not Found'));

        const result = await getOneOrgSecret(
          { by: { unique: { org, name: 'NONEXISTENT' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockGetOrgSecret.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(
          getOneOrgSecret(
            { by: { unique: { org, name: 'TEST_SECRET' } } },
            context,
          ),
        ).rejects.toThrow('github.getOrgSecret error');
      });
    });
  });
});
