import { UnexpectedCodePathError } from 'helpful-errors';
import { genContextLogTrail } from 'sdk-logs';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getSampleRepo } from '@src/.test/assets/getSampleRepo';

import { getBranch } from './getBranch';
import { setBranch } from './setBranch';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('setBranch', () => {
  describe('live tests', () => {
    it('should create a new branch with explicit commit.sha', async () => {
      const sampleRepo = getSampleRepo({
        owner: 'ehmpathy',
        name: 'declastruct-github-demo',
      });

      // Get a commit SHA from the demo repo's main branch
      const demoRepoBranch =
        (await getBranch(
          {
            by: {
              unique: {
                repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
                name: 'main',
              },
            },
          },
          getContext(),
        )) ??
        UnexpectedCodePathError.throw('demo repo branch not found', {
          sampleRepo,
        });

      const branchName = `test-branch-${Date.now()}`;

      const result = await setBranch(
        {
          findsert: {
            repo: {
              owner: sampleRepo.owner,
              name: sampleRepo.name,
            },
            name: branchName,
            commit: { sha: demoRepoBranch.commit!.sha },
          },
        },
        getContext(),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(branchName);
      expect(result.commit?.sha).toBe(demoRepoBranch.commit!.sha);
    });

    it('should return existing branch for findsert', async () => {
      // Use the main declastruct-github repo which we know exists
      const sampleRepo = getSampleRepo({
        owner: 'ehmpathy',
        name: 'declastruct-github',
      });

      const result = await setBranch(
        {
          findsert: {
            repo: {
              owner: sampleRepo.owner,
              name: sampleRepo.name,
            },
            name: 'main',
          },
        },
        getContext(),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('main');
      expect(result.commit?.sha).toBeDefined();
    });
  });
});
