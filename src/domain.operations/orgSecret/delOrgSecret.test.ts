import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

const mockDeleteOrgSecret = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { deleteOrgSecret: mockDeleteOrgSecret },
  })),
}));

const { delOrgSecret } = require('./delOrgSecret');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('delOrgSecret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a secret reference', () => {
    when('the secret exists', () => {
      then('it should delete the secret', async () => {
        mockDeleteOrgSecret.mockResolvedValue({});

        await delOrgSecret({ secret: { org, name: 'TEST_SECRET' } }, context);

        expect(mockDeleteOrgSecret).toHaveBeenCalledWith({
          org: 'test-org',
          secret_name: 'TEST_SECRET',
        });
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockDeleteOrgSecret.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(
          delOrgSecret({ secret: { org, name: 'TEST_SECRET' } }, context),
        ).rejects.toThrow('github.delOrgSecret error');
      });
    });
  });
});
