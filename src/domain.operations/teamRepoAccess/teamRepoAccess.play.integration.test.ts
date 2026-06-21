import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { delTeam } from '@src/domain.operations/team/delTeam';
import { setTeam } from '@src/domain.operations/team/setTeam';

import { delTeamRepoAccess } from './delTeamRepoAccess';
import { getOneTeamRepoAccess } from './getOneTeamRepoAccess';
import { setTeamRepoAccess } from './setTeamRepoAccess';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .what = lifecycle tests for team repo access operations
 * .why = verifies full add, read, update permission, remove cycle
 * .note = requires org admin permissions (admin:org scope)
 *         set TEST_ORG_ADMIN=true to run these tests
 * .note = skipIf used because CI lacks admin:org scope; apply verified via dogfood
 */
const hasOrgAdmin = process.env.TEST_ORG_ADMIN === 'true';
describe('teamRepoAccess lifecycle', () => {
  const context = { log, ...getSampleGithubContext() };
  const org = { login: 'ehmpathy' };
  const repo = { owner: 'ehmpathy', name: 'declastruct-github' };

  given.skipIf(!hasOrgAdmin)('[case1] full access lifecycle', () => {
    // unique slug per test run to avoid collision
    const teamSlug = `test-repo-access-team-${Date.now()}`;

    when('[t0] lifecycle operations are executed', () => {
      then('should complete add, read, update permission, remove', async () => {
        // step 0: create team for access tests
        const team = await setTeam(
          {
            findsert: {
              org,
              slug: teamSlug,
              name: 'Repo Access Test Team',
              description: 'team for repo access lifecycle tests',
              privacy: 'closed',
              notifications: 'disabled',
              parent: null,
            },
          },
          context,
        );
        expect(team).toBeDefined();

        // step 1: verify access does not exist
        const accessBefore = await getOneTeamRepoAccess(
          { by: { unique: { team: { org, slug: teamSlug }, repo } } },
          context,
        );
        expect(accessBefore).toBeNull();
        // snapshot for not-found case
        expect(accessBefore).toMatchSnapshot('access not-found returns null');

        // step 2: add access via findsert
        const accessCreated = await setTeamRepoAccess(
          {
            findsert: {
              team: { org, slug: teamSlug },
              repo,
              permission: 'push',
            },
          },
          context,
        );
        expect(accessCreated).toBeDefined();
        expect(accessCreated.permission).toBe('push');
        // snapshot for created access shape
        expect({
          team: accessCreated.team,
          repo: accessCreated.repo,
          permission: accessCreated.permission,
        }).toMatchSnapshot('access after create');

        // step 3: fetch access after creation
        const accessFetched = await getOneTeamRepoAccess(
          { by: { unique: { team: { org, slug: teamSlug }, repo } } },
          context,
        );
        expect(accessFetched).not.toBeNull();
        expect(accessFetched!.permission).toBe('push');
        // snapshot for fetched access shape
        expect({
          team: accessFetched!.team,
          repo: accessFetched!.repo,
          permission: accessFetched!.permission,
        }).toMatchSnapshot('access after fetch');

        // step 4: findsert again (idempotent - should not update permission)
        const accessFindsertAgain = await setTeamRepoAccess(
          {
            findsert: {
              team: { org, slug: teamSlug },
              repo,
              permission: 'admin', // should be ignored
            },
          },
          context,
        );
        expect(accessFindsertAgain).toBeDefined();
        // findsert does not update, so permission should still be push
        expect(accessFindsertAgain.permission).toBe('push');
        // snapshot for findsert idempotent return
        expect({
          team: accessFindsertAgain.team,
          repo: accessFindsertAgain.repo,
          permission: accessFindsertAgain.permission,
        }).toMatchSnapshot('access after idempotent findsert');

        // step 5: upsert to change permission
        const accessUpserted = await setTeamRepoAccess(
          {
            upsert: {
              team: { org, slug: teamSlug },
              repo,
              permission: 'maintain',
            },
          },
          context,
        );
        expect(accessUpserted).toBeDefined();
        expect(accessUpserted.permission).toBe('maintain');
        // snapshot for upserted access shape
        expect({
          team: accessUpserted.team,
          repo: accessUpserted.repo,
          permission: accessUpserted.permission,
        }).toMatchSnapshot('access after upsert');

        // step 6: remove access
        await delTeamRepoAccess(
          { by: { ref: { team: { org, slug: teamSlug }, repo } } },
          context,
        );

        // step 7: verify access is removed
        const accessAfterDelete = await getOneTeamRepoAccess(
          { by: { unique: { team: { org, slug: teamSlug }, repo } } },
          context,
        );
        expect(accessAfterDelete).toBeNull();
        // snapshot for deleted state (same as not-found)
        expect(accessAfterDelete).toMatchSnapshot(
          'access after delete returns null',
        );

        // cleanup: delete team
        await delTeam({ by: { ref: { org, slug: teamSlug } } }, context);
      });
    });
  });
});
