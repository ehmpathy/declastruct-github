import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

import * as castModule from './castToDeclaredGithubOrgVariable';

const mockListOrgVariables = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { listOrgVariables: mockListOrgVariables },
  })),
}));

jest.mock('./castToDeclaredGithubOrgVariable');

const { getAllOrgVariables } = require('./getAllOrgVariables');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('getAllOrgVariables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('an org reference', () => {
    when('the org has variables', () => {
      then('it should return all variables', async () => {
        const apiResponse = {
          variables: [
            { name: 'VAR_1', value: 'value1', visibility: 'private' },
            { name: 'VAR_2', value: 'value2', visibility: 'all' },
          ],
        };
        const castedVars = [
          { org, name: 'VAR_1', value: 'value1' },
          { org, name: 'VAR_2', value: 'value2' },
        ];

        mockListOrgVariables.mockResolvedValue({ data: apiResponse });
        (castModule.castToDeclaredGithubOrgVariable as jest.Mock)
          .mockReturnValueOnce(castedVars[0])
          .mockReturnValueOnce(castedVars[1]);

        const result = await getAllOrgVariables({ org }, context);

        expect(mockListOrgVariables).toHaveBeenCalledWith({ org: 'test-org' });
        expect(result).toEqual(castedVars);
      });
    });

    when('the org has no variables', () => {
      then('it should return an empty array', async () => {
        mockListOrgVariables.mockResolvedValue({ data: { variables: [] } });

        const result = await getAllOrgVariables({ org }, context);

        expect(result).toEqual([]);
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockListOrgVariables.mockRejectedValue(
          new Error('Rate limit exceeded'),
        );

        await expect(getAllOrgVariables({ org }, context)).rejects.toThrow(
          'github.getAllOrgVariables error',
        );
      });
    });
  });
});
