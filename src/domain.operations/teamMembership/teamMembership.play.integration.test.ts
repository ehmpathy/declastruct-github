import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { delTeam } from '@src/domain.operations/team/delTeam';
import { setTeam } from '@src/domain.operations/team/setTeam';

import { delTeamMembership } from './delTeamMembership';
import { getOneTeamMembership } from './getOneTeamMembership';
import { setTeamMembership } from './setTeamMembership';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .what = lifecycle tests for team membership operations
 * .why = verifies full add, read, update role, remove cycle
 * .note = requires org admin permissions (admin:org scope)
 *         set TEST_ORG_ADMIN=true to run these tests
 * .note = skipIf used because CI lacks admin:org scope; apply verified via dogfood
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const hasOrgAdmin = process.env.TEST_ORG_ADMIN === 'true';
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('teamMembership lifecycle', () => {
  const org = { login: 'ehmpathy' };

  given.skipIf(!hasOrgAdmin)('[case1] full membership lifecycle', () => {
    // unique slug per test run to avoid collision
    const teamSlug = `test-membership-team-${Date.now()}`;
    const username = 'uladkasach'; // org member

    when('[t0] lifecycle operations are executed', () => {
      then('should complete add, read, update role, remove', async () => {
        // step 0: create team for membership tests
        const team = await setTeam(
          {
            findsert: {
              org,
              slug: teamSlug,
              name: 'Membership Test Team',
              description: 'team for membership lifecycle tests',
              privacy: 'closed',
              notifications: 'disabled',
              parent: null,
            },
          },
          getContext(),
        );
        expect(team).toBeDefined();

        // step 1: verify membership does not exist
        const membershipBefore = await getOneTeamMembership(
          { by: { unique: { team: { org, slug: teamSlug }, username } } },
          getContext(),
        );
        expect(membershipBefore).toBeNull();
        // snapshot for not-found case
        expect(membershipBefore).toMatchSnapshot(
          'membership not-found returns null',
        );

        // step 2: add membership via findsert
        const membershipCreated = await setTeamMembership(
          {
            findsert: {
              team: { org, slug: teamSlug },
              username,
              role: 'member',
            },
          },
          getContext(),
        );
        expect(membershipCreated).toBeDefined();
        expect(membershipCreated.username).toBe(username);
        expect(membershipCreated.role).toBe('member');
        // snapshot for created membership shape
        expect({
          team: membershipCreated.team,
          username: membershipCreated.username,
          role: membershipCreated.role,
        }).toMatchSnapshot('membership after create');

        // step 3: fetch membership after creation
        const membershipFetched = await getOneTeamMembership(
          { by: { unique: { team: { org, slug: teamSlug }, username } } },
          getContext(),
        );
        expect(membershipFetched).not.toBeNull();
        expect(membershipFetched!.username).toBe(username);
        expect(membershipFetched!.role).toBe('member');
        // snapshot for fetched membership shape
        expect({
          team: membershipFetched!.team,
          username: membershipFetched!.username,
          role: membershipFetched!.role,
        }).toMatchSnapshot('membership after fetch');

        // step 4: findsert again (idempotent - should not update role)
        const membershipFindsertAgain = await setTeamMembership(
          {
            findsert: {
              team: { org, slug: teamSlug },
              username,
              role: 'maintainer', // should be ignored
            },
          },
          getContext(),
        );
        expect(membershipFindsertAgain).toBeDefined();
        // findsert does not update, so role should still be member
        expect(membershipFindsertAgain.role).toBe('member');
        // snapshot for findsert idempotent return
        expect({
          team: membershipFindsertAgain.team,
          username: membershipFindsertAgain.username,
          role: membershipFindsertAgain.role,
        }).toMatchSnapshot('membership after idempotent findsert');

        // step 5: upsert to change role
        const membershipUpserted = await setTeamMembership(
          {
            upsert: {
              team: { org, slug: teamSlug },
              username,
              role: 'maintainer',
            },
          },
          getContext(),
        );
        expect(membershipUpserted).toBeDefined();
        expect(membershipUpserted.role).toBe('maintainer');
        // snapshot for upserted membership shape
        expect({
          team: membershipUpserted.team,
          username: membershipUpserted.username,
          role: membershipUpserted.role,
        }).toMatchSnapshot('membership after upsert');

        // step 6: remove membership
        await delTeamMembership(
          { by: { ref: { team: { org, slug: teamSlug }, username } } },
          getContext(),
        );

        // step 7: verify membership is removed
        const membershipAfterDelete = await getOneTeamMembership(
          { by: { unique: { team: { org, slug: teamSlug }, username } } },
          getContext(),
        );
        expect(membershipAfterDelete).toBeNull();
        // snapshot for deleted state (same as not-found)
        expect(membershipAfterDelete).toMatchSnapshot(
          'membership after delete returns null',
        );

        // cleanup: delete team
        await delTeam({ by: { ref: { org, slug: teamSlug } } }, getContext());
      });
    });
  });
});
