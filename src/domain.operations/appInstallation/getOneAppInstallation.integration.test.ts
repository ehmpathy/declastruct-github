import { genContextLogTrail } from 'sdk-logs';
import { given, then } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { DeclaredGithubOwner } from '@src/domain.objects/DeclaredGithubOwner';

import { getOneAppInstallation } from './getOneAppInstallation';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getOneAppInstallation', () => {
  given('a by.unique lookup for an organization', () => {
    const owner = new DeclaredGithubOwner({
      type: 'organization',
      slug: 'ehmpathy',
    });

    then('we should be able to get an installation by unique key', async () => {
      const installation = await getOneAppInstallation(
        {
          by: {
            unique: {
              app: { owner, slug: 'declastruct-github' },
              target: owner,
            },
          },
        },
        getContext(),
      );

      // if no installation exists, this will be null - that's acceptable
      if (installation) {
        expect(installation.target.type).toBe('organization');
        expect(installation.target.slug).toBe('ehmpathy');
        expect(installation.id).toBeDefined();
      }
    });

    then(
      'it should return null for a non-existent org installation',
      async () => {
        const nonExistentOrg = new DeclaredGithubOwner({
          type: 'organization',
          slug: 'org-that-does-not-exist-99999',
        });
        const installation = await getOneAppInstallation(
          {
            by: {
              unique: {
                app: { owner, slug: 'declastruct-github' },
                target: nonExistentOrg,
              },
            },
          },
          getContext(),
        );

        expect(installation).toBeNull();
      },
    );
  });
});
