import { getError, HelpfulError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { DeclaredGithubAppInstallation } from '@src/domain.objects/DeclaredGithubAppInstallation';
import { DeclaredGithubOwner } from '@src/domain.objects/DeclaredGithubOwner';

import { setAppInstallation } from './setAppInstallation';

// mock dependencies
jest.mock('./getOneAppInstallation');
jest.mock('../../access/sdks/getGithubClient');

const { getOneAppInstallation } = jest.requireMock('./getOneAppInstallation');
const { getGithubClient } = jest.requireMock(
  '../../access/sdks/getGithubClient',
);

const log = console;

describe('setAppInstallation', () => {
  const mockContext = {
    log,
    github: { token: 'test-token' },
  };

  const owner = new DeclaredGithubOwner({
    type: 'organization',
    slug: 'ehmpathy',
  });
  const sampleInstallation: DeclaredGithubAppInstallation =
    new DeclaredGithubAppInstallation({
      app: { owner, slug: 'my-test-app' },
      target: owner,
      repositorySelection: 'selected',
      repositories: ['repo-a', 'repo-b'],
    });

  const mockGithub = {
    repos: {
      get: jest.fn(),
    },
    apps: {
      addRepoToInstallationForAuthenticatedUser: jest.fn(),
      removeRepoFromInstallationForAuthenticatedUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getGithubClient.mockReturnValue(mockGithub);
  });

  given('a finsert operation', () => {
    when('the installation already exists', () => {
      const foundInstallation = DeclaredGithubAppInstallation.as({
        id: 12345,
        ...sampleInstallation,
      });

      beforeEach(() => {
        getOneAppInstallation.mockResolvedValue(foundInstallation);
      });

      then('it should return the existing installation', async () => {
        const result = await setAppInstallation(
          { finsert: sampleInstallation },
          mockContext as never,
        );

        expect(result).toEqual(foundInstallation);
        expect(getOneAppInstallation).toHaveBeenCalledWith(
          {
            by: {
              unique: {
                app: sampleInstallation.app,
                target: sampleInstallation.target,
              },
            },
          },
          expect.objectContaining({
            github: { token: 'test-token' },
          }),
        );
      });
    });

    when('the installation does not exist', () => {
      beforeEach(() => {
        getOneAppInstallation.mockResolvedValue(null);
      });

      then(
        'it should throw HelpfulError with installation instructions',
        async () => {
          const error = await getError(
            setAppInstallation(
              { finsert: sampleInstallation },
              mockContext as never,
            ),
          );

          expect(error).toBeInstanceOf(HelpfulError);
          expect(error.message).toContain('cannot be created via API');
          expect(error.message).toContain(
            '/apps/my-test-app/installations/new',
          );
        },
      );
    });
  });

  given('an upsert operation', () => {
    when('the installation does not exist', () => {
      beforeEach(() => {
        getOneAppInstallation.mockResolvedValue(null);
      });

      then(
        'it should throw HelpfulError with installation instructions',
        async () => {
          const error = await getError(
            setAppInstallation(
              { upsert: sampleInstallation },
              mockContext as never,
            ),
          );

          expect(error).toBeInstanceOf(HelpfulError);
          expect(error.message).toContain('cannot be created via API');
        },
      );
    });

    when('the installation exists with different repositories', () => {
      const foundInstallation = DeclaredGithubAppInstallation.as({
        id: 12345,
        ...sampleInstallation,
        repositories: ['repo-a', 'repo-c'], // has repo-c instead of repo-b
      });

      // installation state after sync completes
      const syncedInstallation = DeclaredGithubAppInstallation.as({
        id: 12345,
        ...sampleInstallation,
        repositories: ['repo-a', 'repo-b'],
      });

      beforeEach(() => {
        // first call returns original state, second call returns synced state
        getOneAppInstallation
          .mockResolvedValueOnce(foundInstallation)
          .mockResolvedValueOnce(syncedInstallation);
        mockGithub.repos.get.mockImplementation(({ repo }) =>
          Promise.resolve({ data: { id: `id-${repo}` } }),
        );
        mockGithub.apps.addRepoToInstallationForAuthenticatedUser.mockResolvedValue(
          {},
        );
        mockGithub.apps.removeRepoFromInstallationForAuthenticatedUser.mockResolvedValue(
          {},
        );
      });

      then('it should add missing repos', async () => {
        await setAppInstallation(
          { upsert: sampleInstallation },
          mockContext as never,
        );

        expect(mockGithub.repos.get).toHaveBeenCalledWith({
          owner: 'ehmpathy',
          repo: 'repo-b',
        });
        expect(
          mockGithub.apps.addRepoToInstallationForAuthenticatedUser,
        ).toHaveBeenCalledWith({
          installation_id: 12345,
          repository_id: 'id-repo-b',
        });
      });

      then('it should remove extra repos', async () => {
        await setAppInstallation(
          { upsert: sampleInstallation },
          mockContext as never,
        );

        expect(mockGithub.repos.get).toHaveBeenCalledWith({
          owner: 'ehmpathy',
          repo: 'repo-c',
        });
        expect(
          mockGithub.apps.removeRepoFromInstallationForAuthenticatedUser,
        ).toHaveBeenCalledWith({
          installation_id: 12345,
          repository_id: 'id-repo-c',
        });
      });

      then(
        'it should return updated installation with synced repos',
        async () => {
          const result = await setAppInstallation(
            { upsert: sampleInstallation },
            mockContext as never,
          );

          expect(result.repositories).toEqual(['repo-a', 'repo-b']);
        },
      );
    });

    when('the installation exists with repositorySelection = all', () => {
      const installationAll = new DeclaredGithubAppInstallation({
        ...sampleInstallation,
        repositorySelection: 'all',
        repositories: null,
      });
      const foundInstallation = DeclaredGithubAppInstallation.as({
        id: 12345,
        ...installationAll,
      });

      beforeEach(() => {
        getOneAppInstallation.mockResolvedValue(foundInstallation);
      });

      then('it should return the installation without syncing', async () => {
        const result = await setAppInstallation(
          { upsert: installationAll },
          mockContext as never,
        );

        expect(result).toEqual(foundInstallation);
        expect(mockGithub.repos.get).not.toHaveBeenCalled();
      });
    });
  });
});
