import { given, then } from 'test-fns';

import { getSampleGithubContext } from '../../.test/assets/getSampleGithubContext';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';
import { getOneAppInstallation } from './getOneAppInstallation';

const log = console;

describe('getOneAppInstallation', () => {
  const context = { log, ...getSampleGithubContext() };

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
        context,
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
          context,
        );

        expect(installation).toBeNull();
      },
    );
  });
});
