import { given, then, when } from 'test-fns';
import { genContextLogTrail, type ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

const mockDeleteOrgVariable = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: { deleteOrgVariable: mockDeleteOrgVariable },
  })),
}));

const { delOrgVariable } = require('./delOrgVariable');

const context: ContextGithubApi & ContextLogTrail = {
  github: { token: 'test-token' },
  ...genContextLogTrail({ trail: null, env: null }),
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
