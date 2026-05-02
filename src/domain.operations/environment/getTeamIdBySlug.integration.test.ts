import { getError, given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getTeamIdBySlug } from './getTeamIdBySlug';

const log = console;

/**
 * .what = integration tests for getTeamIdBySlug
 * .why = verifies team lookup throws helpful error when team not found
 * .note = success path tested indirectly via environment.play.integration.test.ts
 *         when reviewers include teams; direct test requires org admin to create teams
 */
describe('getTeamIdBySlug', () => {
  const context = { log, ...getSampleGithubContext() };

  given('[case1] invalid team', () => {
    when('[t0] team does not exist', () => {
      then('it should throw BadRequestError', async () => {
        const error = await getError(
          getTeamIdBySlug(
            { org: 'ehmpathy', slug: 'this-team-does-not-exist-12345' },
            context,
          ),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      });
    });
  });
});
