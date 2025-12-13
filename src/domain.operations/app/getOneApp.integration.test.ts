import { given, then } from 'test-fns';

import { getSampleGithubContext } from '../../.test/assets/getSampleGithubContext';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';
import { getOneApp } from './getOneApp';

const log = console;

describe('getOneApp', () => {
  const context = { log, ...getSampleGithubContext() };

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
        context,
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
        context,
      );

      expect(app).toBeNull();
    });
  });
});
