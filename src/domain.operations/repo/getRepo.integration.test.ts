import { genContextLogTrail } from 'sdk-logs';
import { given, then } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getSampleRepo } from '@src/.test/assets/getSampleRepo';

import { getRepo } from './getRepo';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getRepo', () => {
  given('a live example repo exists', () => {
    then('we should be able to get its state', async () => {
      const sampleRepo = getSampleRepo({
        owner: 'ehmpathy',
        name: 'declastruct-github',
      });

      const repo = await getRepo(
        {
          by: {
            unique: {
              owner: sampleRepo.owner,
              name: sampleRepo.name,
            },
          },
        },
        getContext(),
      );

      console.log(repo);
      expect(repo).toBeDefined();
      expect(repo?.name).toBe(sampleRepo.name);
      expect(repo?.owner).toBe(sampleRepo.owner);
      expect(repo?.id).toBeDefined();
    });
  });

  given('a repo that does not exist', () => {
    then('it should return null', async () => {
      const repo = await getRepo(
        {
          by: {
            unique: {
              owner: 'ehmpathy',
              name: 'repo-that-does-not-exist-99999',
            },
          },
        },
        getContext(),
      );

      expect(repo).toBeNull();
    });
  });
});
