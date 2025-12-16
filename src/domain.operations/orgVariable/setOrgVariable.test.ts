import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgVariable } from '../../domain.objects/DeclaredGithubOrgVariable';
import * as getModule from './getOneOrgVariable';

const mockCreateOrgVariable = jest.fn();
const mockUpdateOrgVariable = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: {
      createOrgVariable: mockCreateOrgVariable,
      updateOrgVariable: mockUpdateOrgVariable,
    },
  })),
}));

jest.mock('./getOneOrgVariable');
jest.mock('../repo/getRepo');

const { setOrgVariable } = require('./setOrgVariable');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

const variableSample: DeclaredGithubOrgVariable = {
  org,
  name: 'TEST_VAR',
  value: 'test-value',
  visibility: 'private',
};

describe('setOrgVariable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a finsert operation', () => {
    when('the variable already exists', () => {
      then('it should return the existing variable', async () => {
        const before = { ...variableSample };
        (getModule.getOneOrgVariable as jest.Mock).mockResolvedValue(before);

        const result = await setOrgVariable(
          { finsert: variableSample },
          context,
        );

        expect(result).toBe(before);
        expect(mockCreateOrgVariable).not.toHaveBeenCalled();
        expect(mockUpdateOrgVariable).not.toHaveBeenCalled();
      });
    });

    when('the variable does not exist', () => {
      then('it should create the variable', async () => {
        const created = { ...variableSample };

        (getModule.getOneOrgVariable as jest.Mock)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(created);
        mockCreateOrgVariable.mockResolvedValue({});

        const result = await setOrgVariable(
          { finsert: variableSample },
          context,
        );

        expect(mockCreateOrgVariable).toHaveBeenCalledWith({
          org: 'test-org',
          name: 'TEST_VAR',
          value: 'test-value',
          visibility: 'private',
          selected_repository_ids: undefined,
        });
        expect(result).toEqual(created);
      });
    });
  });

  given('an upsert operation', () => {
    when('the variable exists', () => {
      then('it should update the variable', async () => {
        const before = { ...variableSample };
        const updated = { ...variableSample, value: 'updated-value' };

        (getModule.getOneOrgVariable as jest.Mock)
          .mockResolvedValueOnce(before)
          .mockResolvedValueOnce(updated);
        mockUpdateOrgVariable.mockResolvedValue({});

        const result = await setOrgVariable(
          { upsert: variableSample },
          context,
        );

        expect(mockUpdateOrgVariable).toHaveBeenCalledWith({
          org: 'test-org',
          name: 'TEST_VAR',
          value: 'test-value',
          visibility: 'private',
          selected_repository_ids: undefined,
        });
        expect(result).toEqual(updated);
      });
    });

    when('the variable does not exist', () => {
      then('it should create the variable', async () => {
        const created = { ...variableSample };

        (getModule.getOneOrgVariable as jest.Mock)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(created);
        mockCreateOrgVariable.mockResolvedValue({});

        const result = await setOrgVariable(
          { upsert: variableSample },
          context,
        );

        expect(mockCreateOrgVariable).toHaveBeenCalled();
        expect(result).toEqual(created);
      });
    });
  });
});
