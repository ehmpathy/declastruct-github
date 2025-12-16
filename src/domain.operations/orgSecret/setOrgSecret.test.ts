import { given, then, when } from 'test-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';

import * as getModule from './getOneOrgSecret';

const mockGetOrgPublicKey = jest.fn();
const mockCreateOrUpdateOrgSecret = jest.fn();

jest.mock('../../access/sdks/getGithubClient', () => ({
  getGithubClient: jest.fn(() => ({
    actions: {
      getOrgPublicKey: mockGetOrgPublicKey,
      createOrUpdateOrgSecret: mockCreateOrUpdateOrgSecret,
    },
  })),
}));

jest.mock('./getOneOrgSecret');
jest.mock('../repo/getRepo');
jest.mock('libsodium-wrappers', () => ({
  ready: Promise.resolve(),
  from_base64: jest.fn(() => new Uint8Array(32)),
  from_string: jest.fn(() => new Uint8Array(16)),
  crypto_box_seal: jest.fn(() => new Uint8Array(48)),
  to_base64: jest.fn(() => 'encrypted-value'),
  base64_variants: { ORIGINAL: 0 },
}));

const { setOrgSecret } = require('./setOrgSecret');

const context: ContextGithubApi & VisualogicContext = {
  github: { token: 'test-token' },
  log: console,
};

const org = { login: 'test-org' };

const secretSample: DeclaredGithubOrgSecret = {
  org,
  name: 'TEST_SECRET',
  value: 'secret-value',
  visibility: 'private',
};

describe('setOrgSecret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrgPublicKey.mockResolvedValue({
      data: { key: 'base64-public-key', key_id: 'key-123' },
    });
  });

  given('a findsert operation', () => {
    when('the secret already exists', () => {
      then('it should return the existing secret', async () => {
        const before = { ...secretSample, value: undefined };
        (getModule.getOneOrgSecret as jest.Mock).mockResolvedValue(before);

        const result = await setOrgSecret({ findsert: secretSample }, context);

        expect(result).toBe(before);
        expect(mockCreateOrUpdateOrgSecret).not.toHaveBeenCalled();
      });
    });

    when('the secret does not exist and value is provided', () => {
      then('it should create the secret', async () => {
        const created = { ...secretSample, value: undefined };

        (getModule.getOneOrgSecret as jest.Mock)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(created);
        mockCreateOrUpdateOrgSecret.mockResolvedValue({});

        const result = await setOrgSecret({ findsert: secretSample }, context);

        expect(mockGetOrgPublicKey).toHaveBeenCalledWith({ org: 'test-org' });
        expect(mockCreateOrUpdateOrgSecret).toHaveBeenCalledWith({
          org: 'test-org',
          secret_name: 'TEST_SECRET',
          encrypted_value: 'encrypted-value',
          key_id: 'key-123',
          visibility: 'private',
          selected_repository_ids: undefined,
        });
        expect(result).toEqual(created);
      });
    });

    when('the secret does not exist and no value is provided', () => {
      then('it should throw an error', async () => {
        const secretWithoutValue = { ...secretSample, value: undefined };
        (getModule.getOneOrgSecret as jest.Mock).mockResolvedValue(null);

        await expect(
          setOrgSecret({ findsert: secretWithoutValue }, context),
        ).rejects.toThrow('Cannot create secret without a value');
      });
    });
  });

  given('an upsert operation', () => {
    when('the secret exists and value is provided', () => {
      then('it should update the secret', async () => {
        const before = { ...secretSample, value: undefined };
        const updated = { ...secretSample, value: undefined };

        (getModule.getOneOrgSecret as jest.Mock)
          .mockResolvedValueOnce(before)
          .mockResolvedValueOnce(updated);
        mockCreateOrUpdateOrgSecret.mockResolvedValue({});

        const result = await setOrgSecret({ upsert: secretSample }, context);

        expect(mockCreateOrUpdateOrgSecret).toHaveBeenCalled();
        expect(result).toEqual(updated);
      });
    });

    when('visibility changed but no value provided', () => {
      then('it should throw an error', async () => {
        const before = {
          ...secretSample,
          value: undefined,
          visibility: 'private' as const,
        };
        const desiredWithNewVisibility = {
          ...secretSample,
          value: undefined,
          visibility: 'all' as const,
        };

        (getModule.getOneOrgSecret as jest.Mock).mockResolvedValue(before);

        await expect(
          setOrgSecret({ upsert: desiredWithNewVisibility }, context),
        ).rejects.toThrow(
          'Cannot update secret visibility without re-providing the secret value',
        );
      });
    });

    when('no changes needed and no value provided', () => {
      then('it should return the existing secret', async () => {
        const before = { ...secretSample, value: undefined };
        const desiredWithoutValue = { ...secretSample, value: undefined };

        (getModule.getOneOrgSecret as jest.Mock).mockResolvedValue(before);

        const result = await setOrgSecret(
          { upsert: desiredWithoutValue },
          context,
        );

        expect(result).toBe(before);
        expect(mockCreateOrUpdateOrgSecret).not.toHaveBeenCalled();
      });
    });
  });
});
