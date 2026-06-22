import { genContextLogTrail } from 'sdk-logs';
import { given, then } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { DeclaredGithubOwner } from '@src/domain.objects/DeclaredGithubOwner';

import { getOneApp } from './getOneApp';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getOneApp', () => {
  given('a known public GitHub App exists', () => {
    then('we should be able to get its state by slug', async () => {
      // use github-actions app (a well-known public app)
      const app = await getOneApp(
        {
          by: {
            unique: {
              owner: new DeclaredGithubOwner({
                type: 'organization',
                slug: 'github',
              }),
              slug: 'github-actions',
            },
          },
        },
        getContext(),
      );

      console.log(app);
      expect(app).toBeDefined();
      expect(app?.slug).toBe('github-actions');
      expect(app?.id).toBeDefined();
    });
  });

  given('an app that does not exist', () => {
    then('it should return null', async () => {
      const app = await getOneApp(
        {
          by: {
            unique: {
              owner: new DeclaredGithubOwner({
                type: 'organization',
                slug: 'ehmpathy',
              }),
              slug: 'app-that-does-not-exist-99999',
            },
          },
        },
        getContext(),
      );

      expect(app).toBeNull();
    });
  });
});
