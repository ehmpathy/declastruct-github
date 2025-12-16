import { UnexpectedCodePathError } from 'helpful-errors';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getSampleRepo } from '@src/.test/assets/getSampleRepo';

import { getBranch } from './getBranch';
import { setBranch } from './setBranch';

const log = console;

describe('setBranch', () => {
  const context = { log, ...getSampleGithubContext() };

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
          context,
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
        context,
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
        context,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('main');
      expect(result.commit?.sha).toBeDefined();
    });
  });
});
