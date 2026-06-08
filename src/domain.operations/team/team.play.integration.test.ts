import { getError, given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { delTeam } from './delTeam';
import { getOneTeam } from './getOneTeam';
import { setTeam } from './setTeam';

const log = console;

/**
 * .what = lifecycle tests for team operations
 * .why = verifies full create, read, update, delete cycle
 * .note = requires org admin permissions (admin:org scope)
 *         set TEST_ORG_ADMIN=true to run these tests
 * .note = skipIf used because CI lacks admin:org scope; apply verified via dogfood
 */
const hasOrgAdmin = process.env.TEST_ORG_ADMIN === 'true';
describe('team lifecycle', () => {
  const context = { log, ...getSampleGithubContext() };
  const org = { login: 'ehmpathy' };

  given.skipIf(!hasOrgAdmin)('[case1] full team lifecycle', () => {
    // unique slug per test run to avoid collision
    const teamSlug = `test-team-${Date.now()}`;

    when('[t0] lifecycle operations are executed', () => {
      then('should complete create, read, update, delete', async () => {
        // step 1: verify team does not exist
        const teamBefore = await getOneTeam(
          { by: { unique: { org, slug: teamSlug } } },
          context,
        );
        expect(teamBefore).toBeNull();
        // snapshot for not-found case
        expect(teamBefore).toMatchSnapshot('team not-found returns null');

        // step 2: create team via findsert
        const teamCreated = await setTeam(
          {
            findsert: {
              org,
              slug: teamSlug,
              name: 'Test Team',
              description: 'test team for integration tests',
              privacy: 'closed',
              notifications: 'disabled',
              parent: null,
            },
          },
          context,
        );
        expect(teamCreated).toBeDefined();
        expect(teamCreated.slug).toBe(teamSlug);
        expect(teamCreated.org.login).toBe(org.login);
        expect(teamCreated.id).toBeDefined();
        // snapshot for created team shape (excludes dynamic slug and id)
        expect({
          org: teamCreated.org,
          name: teamCreated.name,
          description: teamCreated.description,
          privacy: teamCreated.privacy,
          notifications: teamCreated.notifications,
          parent: teamCreated.parent,
        }).toMatchSnapshot('team after create');

        // step 3: fetch team after creation
        const teamFetched = await getOneTeam(
          { by: { unique: { org, slug: teamSlug } } },
          context,
        );
        expect(teamFetched).not.toBeNull();
        expect(teamFetched!.slug).toBe(teamSlug);
        // snapshot for fetched team shape (excludes dynamic slug and id)
        expect({
          org: teamFetched!.org,
          name: teamFetched!.name,
          description: teamFetched!.description,
          privacy: teamFetched!.privacy,
          notifications: teamFetched!.notifications,
          parent: teamFetched!.parent,
        }).toMatchSnapshot('team after fetch');

        // step 4: findsert again (idempotent - should not update)
        const teamFindsertAgain = await setTeam(
          {
            findsert: {
              org,
              slug: teamSlug,
              name: 'Different Name', // should be ignored
              description: 'different description',
              privacy: 'closed',
              notifications: 'disabled',
              parent: null,
            },
          },
          context,
        );
        expect(teamFindsertAgain).toBeDefined();
        expect(teamFindsertAgain.slug).toBe(teamSlug);
        // findsert does not update, so name should still be original
        expect(teamFindsertAgain.name).toBe('Test Team');
        // snapshot for findsert idempotent return (excludes dynamic slug and id)
        expect({
          org: teamFindsertAgain.org,
          name: teamFindsertAgain.name,
          description: teamFindsertAgain.description,
          privacy: teamFindsertAgain.privacy,
          notifications: teamFindsertAgain.notifications,
          parent: teamFindsertAgain.parent,
        }).toMatchSnapshot('team after idempotent findsert');

        // step 5: upsert (should update)
        const teamUpserted = await setTeam(
          {
            upsert: {
              org,
              slug: teamSlug,
              name: 'Updated Test Team',
              description: 'updated description',
              privacy: 'closed',
              notifications: 'enabled',
              parent: null,
            },
          },
          context,
        );
        expect(teamUpserted).toBeDefined();
        expect(teamUpserted.slug).toBe(teamSlug);
        expect(teamUpserted.name).toBe('Updated Test Team');
        expect(teamUpserted.description).toBe('updated description');
        expect(teamUpserted.notifications).toBe('enabled');
        // snapshot for upserted team shape (excludes dynamic slug and id)
        expect({
          org: teamUpserted.org,
          name: teamUpserted.name,
          description: teamUpserted.description,
          privacy: teamUpserted.privacy,
          notifications: teamUpserted.notifications,
          parent: teamUpserted.parent,
        }).toMatchSnapshot('team after upsert');

        // step 6: delete team
        await delTeam({ by: { ref: { org, slug: teamSlug } } }, context);

        // step 7: verify team is deleted
        const teamAfterDelete = await getOneTeam(
          { by: { unique: { org, slug: teamSlug } } },
          context,
        );
        expect(teamAfterDelete).toBeNull();
        // snapshot for deleted state (same as not-found)
        expect(teamAfterDelete).toMatchSnapshot(
          'team after delete returns null',
        );
      });
    });
  });

  given.skipIf(!hasOrgAdmin)(
    '[case2] validation error: absent parent team',
    () => {
      /**
       * .what = validates setTeam rejects when parent team does not exist
       * .why = parent team must exist before child team creation
       * .note = secret+parent validation is covered in DeclaredGithubTeam.test.ts
       */
      when('[t0] setTeam is called with absent parent', () => {
        then('it throws BadRequestError with snapshot', async () => {
          const error = await getError(async () =>
            setTeam(
              {
                findsert: {
                  org: { login: 'ehmpathy' },
                  slug: 'child-with-absent-parent',
                  name: 'Child With Absent Parent',
                  description: null,
                  privacy: 'closed',
                  notifications: 'disabled',
                  parent: {
                    org: { login: 'ehmpathy' },
                    slug: 'nonexistent-parent-team',
                  },
                },
              },
              context,
            ),
          );

          expect(error).toBeDefined();
          expect(error.message).toContain('parent team not found');
          expect(error.message).toMatchSnapshot('setTeam absent parent error');
        });
      });
    },
  );

  given.skipIf(!hasOrgAdmin)('[case3] nested teams', () => {
    const parentSlug = `test-parent-${Date.now()}`;
    const childSlug = `test-child-${Date.now()}`;

    when('[t0] nested team operations are executed', () => {
      then('should create parent and child teams', async () => {
        // step 1: create parent team
        const parentCreated = await setTeam(
          {
            findsert: {
              org,
              slug: parentSlug,
              name: 'Parent Team',
              description: 'parent team for nested test',
              privacy: 'closed',
              notifications: 'disabled',
              parent: null,
            },
          },
          context,
        );
        expect(parentCreated).toBeDefined();
        expect(parentCreated.slug).toBe(parentSlug);

        // step 2: create child team under parent
        const childCreated = await setTeam(
          {
            findsert: {
              org,
              slug: childSlug,
              name: 'Child Team',
              description: 'child team for nested test',
              privacy: 'closed',
              notifications: 'disabled',
              parent: { org, slug: parentSlug },
            },
          },
          context,
        );
        expect(childCreated).toBeDefined();
        expect(childCreated.slug).toBe(childSlug);
        expect(childCreated.parent).not.toBeNull();
        expect(childCreated.parent!.slug).toBe(parentSlug);
        // snapshot for child team with parent ref
        expect({
          org: childCreated.org,
          name: childCreated.name,
          description: childCreated.description,
          privacy: childCreated.privacy,
          notifications: childCreated.notifications,
          parent: childCreated.parent,
        }).toMatchSnapshot('child team with parent');

        // cleanup: delete child first, then parent
        await delTeam({ by: { ref: { org, slug: childSlug } } }, context);
        await delTeam({ by: { ref: { org, slug: parentSlug } } }, context);
      });
    });
  });
});
