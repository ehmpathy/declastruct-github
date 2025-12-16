import { getError, HelpfulError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { DeclaredGithubApp } from '@src/domain.objects/DeclaredGithubApp';
import { DeclaredGithubAppPermissions } from '@src/domain.objects/DeclaredGithubAppPermissions';
import { DeclaredGithubOwner } from '@src/domain.objects/DeclaredGithubOwner';

import { setApp } from './setApp';

// mock getOneApp
jest.mock('./getOneApp');
const { getOneApp } = jest.requireMock('./getOneApp');

const log = console;

describe('setApp', () => {
  const mockContext = {
    log,
    github: { token: 'test-token' },
  };

  const sampleApp: DeclaredGithubApp = new DeclaredGithubApp({
    owner: new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' }),
    slug: 'my-test-app',
    name: 'My Test App',
    description: 'A test app',
    public: false,
    permissions: new DeclaredGithubAppPermissions({
      repository: {
        contents: 'read',
        pullRequests: 'write',
      },
      organization: null,
    }),
    events: ['push', 'pull_request'],
    homepageUrl: 'https://example.com',
    webhookUrl: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a findsert operation', () => {
    when('the app already exists', () => {
      const foundApp = DeclaredGithubApp.as({
        id: 12345,
        ...sampleApp,
      });

      beforeEach(() => {
        getOneApp.mockResolvedValue(foundApp);
      });

      then('it should return the existing app', async () => {
        const result = await setApp(
          { findsert: sampleApp },
          mockContext as never,
        );

        expect(result).toEqual(foundApp);
        expect(getOneApp).toHaveBeenCalledWith(
          {
            by: {
              unique: {
                owner: sampleApp.owner,
                slug: sampleApp.slug,
              },
            },
          },
          expect.objectContaining({
            github: { token: 'test-token' },
          }),
        );
      });
    });

    when('the app does not exist', () => {
      beforeEach(() => {
        getOneApp.mockResolvedValue(null);
      });

      then(
        'it should throw HelpfulError with creation instructions',
        async () => {
          const error = await getError(
            setApp({ findsert: sampleApp }, mockContext as never),
          );

          expect(error).toBeInstanceOf(HelpfulError);
          expect(error.message).toContain('cannot be created via API');
          expect(error.message).toContain('/settings/apps/new');
        },
      );
    });
  });

  given('name-to-slug validation', () => {
    when('the name does not match the expected slug', () => {
      const mismatchedApp = new DeclaredGithubApp({
        ...sampleApp,
        name: 'Different Name',
        slug: 'my-test-app', // doesn't match "different-name"
      });

      then('it should throw HelpfulError with suggestion', async () => {
        const error = await getError(
          setApp({ findsert: mismatchedApp }, mockContext as never),
        );

        expect(error).toBeInstanceOf(HelpfulError);
        expect(error.message).toContain('will generate slug "different-name"');
        expect(error.message).toContain('expected slug "my-test-app"');
      });
    });
  });

  given('an upsert operation', () => {
    when('the app already exists', () => {
      const foundApp = DeclaredGithubApp.as({
        id: 12345,
        ...sampleApp,
      });

      beforeEach(() => {
        getOneApp.mockResolvedValue(foundApp);
      });

      then(
        'it should throw HelpfulError with update instructions',
        async () => {
          const error = await getError(
            setApp({ upsert: sampleApp }, mockContext as never),
          );

          expect(error).toBeInstanceOf(HelpfulError);
          expect(error.message).toContain('cannot be updated via API');
          expect(error.message).toContain(`/settings/apps/${sampleApp.slug}`);
        },
      );
    });

    when('the app does not exist', () => {
      beforeEach(() => {
        getOneApp.mockResolvedValue(null);
      });

      then(
        'it should throw HelpfulError with creation instructions',
        async () => {
          const error = await getError(
            setApp({ upsert: sampleApp }, mockContext as never),
          );

          expect(error).toBeInstanceOf(HelpfulError);
          expect(error.message).toContain('cannot be created via API');
          expect(error.message).toContain('/settings/apps/new');
        },
      );
    });
  });
});
