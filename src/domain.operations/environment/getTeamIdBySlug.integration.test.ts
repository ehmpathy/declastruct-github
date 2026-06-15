import { genContextLogTrail } from 'sdk-logs';
import { getError, given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getTeamIdBySlug } from './getTeamIdBySlug';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .what = integration tests for getTeamIdBySlug
 * .why = verifies team lookup throws helpful error when team not found
 * .note = success path tested indirectly via environment.play.integration.test.ts
 *         when reviewers include teams; direct test requires org admin to create teams
 */
/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getTeamIdBySlug', () => {
  given('[case1] invalid team', () => {
    when('[t0] team does not exist', () => {
      then('it should throw BadRequestError', async () => {
        const error = await getError(
          getTeamIdBySlug(
            { org: 'ehmpathy', slug: 'this-team-does-not-exist-12345' },
            getContext(),
          ),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      });
    });
  });
});
