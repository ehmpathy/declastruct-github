import { genContextLogTrail } from 'sdk-logs';
import { getError, given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getUserIdByUsername } from './getUserIdByUsername';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getUserIdByUsername', () => {
  given('[case1] valid username', () => {
    when('[t0] user exists', () => {
      then('it should return numeric user ID', async () => {
        // lookup a known GitHub user
        const userId = await getUserIdByUsername(
          { username: 'uladkasach' },
          getContext(),
        );
        expect(typeof userId).toBe('number');
        expect(userId).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] invalid username', () => {
    when('[t0] user does not exist', () => {
      then('it should throw BadRequestError', async () => {
        const error = await getError(
          getUserIdByUsername(
            { username: 'this-user-definitely-does-not-exist-12345' },
            getContext(),
          ),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      });
    });
  });
});
