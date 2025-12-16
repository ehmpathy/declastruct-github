import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

import * as castModule from './castToDeclaredGithubOrgVariable';

const mockGetOrgVariable = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { getOrgVariable: mockGetOrgVariable },
  })),
}));

jest.mock('./castToDeclaredGithubOrgVariable');

const { getOneOrgVariable } = require('./getOneOrgVariable');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('getOneOrgVariable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a by.unique reference', () => {
    when('the variable exists', () => {
      then('it should return the variable', async () => {
        const apiResponse = {
          name: 'TEST_VAR',
          value: 'test-value',
          visibility: 'private',
        };
        const castedVariable = {
          org,
          name: 'TEST_VAR',
          value: 'test-value',
          visibility: 'private',
        };

        mockGetOrgVariable.mockResolvedValue({ data: apiResponse });
        (
          castModule.castToDeclaredGithubOrgVariable as jest.Mock
        ).mockReturnValue(castedVariable);

        const result = await getOneOrgVariable(
          { by: { unique: { org, name: 'TEST_VAR' } } },
          context,
        );

        expect(mockGetOrgVariable).toHaveBeenCalledWith({
          org: 'test-org',
          name: 'TEST_VAR',
        });
        expect(result).toEqual(castedVariable);
      });
    });

    when('the variable does not exist', () => {
      then('it should return null', async () => {
        mockGetOrgVariable.mockRejectedValue(new Error('Not Found'));

        const result = await getOneOrgVariable(
          { by: { unique: { org, name: 'NONEXISTENT' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockGetOrgVariable.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(
          getOneOrgVariable(
            { by: { unique: { org, name: 'TEST_VAR' } } },
            context,
          ),
        ).rejects.toThrow('github.getOrgVariable error');
      });
    });
  });
});
