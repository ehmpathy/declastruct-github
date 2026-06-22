import { genContextLogTrail } from 'sdk-logs';
import { given, then } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getRepos } from './getRepos';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getRepos', () => {
  given('an authenticated user with repos', () => {
    then('we should be able to get a list', async () => {
      const repos = await getRepos({ page: { limit: 10 } }, getContext());
      console.log(repos);
      expect(repos.length).toBeGreaterThan(0);
    });
  });

  given('a specific owner', () => {
    then('we should be able to list their repos', async () => {
      const repos = await getRepos(
        {
          where: { owner: 'ehmpathy' },
          page: { limit: 5 },
        },
        getContext(),
      );
      console.log(repos);
      expect(repos.length).toBeGreaterThan(0);
      expect(repos.every((repo) => repo.owner === 'ehmpathy')).toBe(true);
    });
  });
});
