import { getError, given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getUserIdByUsername } from './getUserIdByUsername';

const log = console;

describe('getUserIdByUsername', () => {
  const context = { log, ...getSampleGithubContext() };

  given('[case1] valid username', () => {
    when('[t0] user exists', () => {
      then('it should return numeric user ID', async () => {
        // lookup a known GitHub user
        const userId = await getUserIdByUsername(
          { username: 'uladkasach' },
          context,
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
            context,
          ),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      });
    });
  });
});
