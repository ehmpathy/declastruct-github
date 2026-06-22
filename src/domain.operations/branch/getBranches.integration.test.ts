import { genContextLogTrail } from 'sdk-logs';
import { given, then } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getSampleRepo } from '@src/.test/assets/getSampleRepo';

import { getBranches } from './getBranches';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('getBranches', () => {
  given('a live example repo with branches', () => {
    then('we should be able to list its branches', async () => {
      const sampleRepo = getSampleRepo({
        owner: 'ehmpathy',
        name: 'declastruct-github-demo',
      });

      const branches = await getBranches(
        {
          where: {
            repo: {
              owner: sampleRepo.owner,
              name: sampleRepo.name,
            },
          },
        },
        getContext(),
      );

      console.log(branches);
      expect(branches).toBeDefined();
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);

      // verify first branch has expected shape
      const firstBranch = branches[0];
      expect(firstBranch?.name).toBeDefined();
      expect(firstBranch?.commit?.sha).toBeDefined();
      expect(firstBranch?.repo).toEqual({
        owner: sampleRepo.owner,
        name: sampleRepo.name,
      });
      expect(typeof firstBranch?.protected).toBe('boolean');
    });
  });
});
