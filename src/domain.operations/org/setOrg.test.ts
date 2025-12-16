import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '../../domain.objects/DeclaredGithubOrg';
import * as castModule from './castToDeclaredGithubOrg';
import * as getOrgModule from './getOneOrg';

const mockOrgsUpdate = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    orgs: { update: mockOrgsUpdate },
  })),
}));

jest.mock('./castToDeclaredGithubOrg');
jest.mock('./getOneOrg');

const { setOrg } = require('./setOrg');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const orgSample: DeclaredGithubOrg = {
  id: 12345,
  login: 'test-org',
  name: 'Test Organization',
  description: 'A test org',
  billingEmail: 'billing@test.org',
};

describe('setOrg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a finsert operation', () => {
    when('the org already exists', () => {
      then('it should return the existing org', async () => {
        const before = { ...orgSample };
        (getOrgModule.getOneOrg as jest.Mock).mockResolvedValue(before);

        const result = await setOrg({ finsert: orgSample }, context);

        expect(result).toBe(before);
        expect(mockOrgsUpdate).not.toHaveBeenCalled();
      });
    });

    when('the org does not exist', () => {
      then('it should throw an error', async () => {
        (getOrgModule.getOneOrg as jest.Mock).mockResolvedValue(null);

        await expect(setOrg({ finsert: orgSample }, context)).rejects.toThrow(
          'GitHub Organization does not exist and cannot be created via API',
        );
      });
    });
  });

  given('an upsert operation', () => {
    when('the org exists', () => {
      then('it should update the org', async () => {
        const before = { ...orgSample };
        const updatedOrg = { ...orgSample, name: 'Updated Org' };

        (getOrgModule.getOneOrg as jest.Mock).mockResolvedValue(before);
        mockOrgsUpdate.mockResolvedValue({ data: updatedOrg });
        (castModule.castToDeclaredGithubOrg as jest.Mock).mockReturnValue(
          updatedOrg,
        );

        const result = await setOrg({ upsert: orgSample }, context);

        expect(mockOrgsUpdate).toHaveBeenCalledWith({
          org: 'test-org',
          name: 'Test Organization',
          description: 'A test org',
          billing_email: 'billing@test.org',
        });
        expect(result).toEqual(updatedOrg);
      });
    });

    when('the org does not exist', () => {
      then('it should throw an error', async () => {
        (getOrgModule.getOneOrg as jest.Mock).mockResolvedValue(null);

        await expect(setOrg({ upsert: orgSample }, context)).rejects.toThrow(
          'GitHub Organization does not exist and cannot be created via API',
        );
      });
    });
  });
});
