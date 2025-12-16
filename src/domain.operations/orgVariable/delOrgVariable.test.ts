import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';

const mockDeleteOrgVariable = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { deleteOrgVariable: mockDeleteOrgVariable },
  })),
}));

const { delOrgVariable } = require('./delOrgVariable');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

describe('delOrgVariable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a variable reference', () => {
    when('the variable exists', () => {
      then('it should delete the variable', async () => {
        mockDeleteOrgVariable.mockResolvedValue({});

        await delOrgVariable({ variable: { org, name: 'TEST_VAR' } }, context);

        expect(mockDeleteOrgVariable).toHaveBeenCalledWith({
          org: 'test-org',
          name: 'TEST_VAR',
        });
      });
    });

    when('an unexpected error occurs', () => {
      then('it should throw a HelpfulError', async () => {
        mockDeleteOrgVariable.mockRejectedValue(
          new Error('Rate limit exceeded'),
        );

        await expect(
          delOrgVariable({ variable: { org, name: 'TEST_VAR' } }, context),
        ).rejects.toThrow('github.delOrgVariable error');
      });
    });
  });
});
