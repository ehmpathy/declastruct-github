import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import * as castModule from './castToDeclaredGithubOrgSecret';

const mockListOrgSecrets = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { listOrgSecrets: mockListOrgSecrets },
  })),
}));

jest.mock('./castToDeclaredGithubOrgSecret');

const { getAllOrgSecrets } = require('./getAllOrgSecrets');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('getAllOrgSecrets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('an org reference', () => {
    when('the org has secrets', () => {
      then('it should return all secrets (values undefined)', async () => {
        const apiResponse = {
          secrets: [
            { name: 'SECRET_1', visibility: 'private' },
            { name: 'SECRET_2', visibility: 'all' },
          ],
        };
        const castedSecrets = [
          { org, name: 'SECRET_1', value: undefined },
          { org, name: 'SECRET_2', value: undefined },
        ];

        mockListOrgSecrets.mockResolvedValue({ data: apiResponse });
        (castModule.castToDeclaredGithubOrgSecret as jest.Mock)
          .mockReturnValueOnce(castedSecrets[0])
          .mockReturnValueOnce(castedSecrets[1]);

        const result = await getAllOrgSecrets({ org }, context);

        expect(mockListOrgSecrets).toHaveBeenCalledWith({ org: 'test-org' });
        expect(result).toEqual(castedSecrets);
        expect(result[0].value).toBeUndefined();
        expect(result[1].value).toBeUndefined();
      });
    });

    when('the org has no secrets', () => {
      then('it should return an empty array', async () => {
        mockListOrgSecrets.mockResolvedValue({ data: { secrets: [] } });

        const result = await getAllOrgSecrets({ org }, context);

        expect(result).toEqual([]);
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockListOrgSecrets.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(getAllOrgSecrets({ org }, context)).rejects.toThrow(
          'github.getAllOrgSecrets error',
        );
      });
    });
  });
});
