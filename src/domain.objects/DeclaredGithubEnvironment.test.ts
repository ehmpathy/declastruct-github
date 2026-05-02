import { getError, given, then, when } from 'test-fns';

import { DeclaredGithubEnvironment } from './DeclaredGithubEnvironment';

describe('DeclaredGithubEnvironment', () => {
  given('[case1] valid config', () => {
    when('[t0] created with all fields', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'production-on-main',
          reviewers: { users: ['alice', 'bob'], teams: null },
          waitTimer: 30,
          deploymentBranchPolicy: { customBranches: ['main'] },
          preventSelfReview: true,
        });

        expect(env).toBeInstanceOf(DeclaredGithubEnvironment);
        expect(env.repo).toEqual({ owner: 'ehmpathy', name: 'test-repo' });
        expect(env.name).toEqual('production-on-main');
        expect(env.reviewers).toEqual({ users: ['alice', 'bob'], teams: null });
        expect(env.waitTimer).toEqual(30);
        expect(env.deploymentBranchPolicy).toEqual({
          customBranches: ['main'],
        });
        expect(env.preventSelfReview).toEqual(true);
      });
    });

    when('[t1] created with null optional fields', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'prep',
          reviewers: null,
          waitTimer: null,
          deploymentBranchPolicy: null,
          preventSelfReview: false,
        });

        expect(env).toBeInstanceOf(DeclaredGithubEnvironment);
        expect(env.reviewers).toBeNull();
        expect(env.waitTimer).toBeNull();
        expect(env.deploymentBranchPolicy).toBeNull();
      });
    });

    when('[t2] created with protectedBranches policy', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'production',
          reviewers: null,
          waitTimer: null,
          deploymentBranchPolicy: { protectedBranches: true },
          preventSelfReview: false,
        });

        expect(env.deploymentBranchPolicy).toEqual({ protectedBranches: true });
      });
    });
  });

  given('[case2] waitTimer boundary values', () => {
    when('[t0] waitTimer is 0 (minimum valid)', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'production',
          reviewers: null,
          waitTimer: 0,
          deploymentBranchPolicy: null,
          preventSelfReview: false,
        });

        expect(env).toBeInstanceOf(DeclaredGithubEnvironment);
        expect(env.waitTimer).toEqual(0);
      });
    });

    when('[t1] waitTimer is 43200 (maximum valid)', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'production',
          reviewers: null,
          waitTimer: 43200,
          deploymentBranchPolicy: null,
          preventSelfReview: false,
        });

        expect(env).toBeInstanceOf(DeclaredGithubEnvironment);
        expect(env.waitTimer).toEqual(43200);
      });
    });
  });

  given('[case3] invalid waitTimer', () => {
    when('[t0] waitTimer exceeds maximum (43200)', () => {
      then('it should throw validation error', async () => {
        const error = await getError(
          async () =>
            new DeclaredGithubEnvironment({
              repo: { owner: 'ehmpathy', name: 'test-repo' },
              name: 'production',
              reviewers: null,
              waitTimer: 50000,
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            }),
        );

        expect(error.message).toContain('waitTimer must be 0-43200 minutes');
        expect(error.message).toContain('50000');
        expect(error.message).toMatchSnapshot('waitTimer exceeds max error');
      });
    });

    when('[t1] waitTimer is negative', () => {
      then('it should throw validation error', async () => {
        const error = await getError(
          async () =>
            new DeclaredGithubEnvironment({
              repo: { owner: 'ehmpathy', name: 'test-repo' },
              name: 'production',
              reviewers: null,
              waitTimer: -5,
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            }),
        );

        expect(error.message).toContain('waitTimer must be 0-43200 minutes');
        expect(error.message).toContain('-5');
        expect(error.message).toMatchSnapshot('waitTimer negative error');
      });
    });
  });

  given('[case4] invalid reviewers count', () => {
    when('[t0] more than 6 reviewers total', () => {
      then('it should throw validation error', async () => {
        const error = await getError(
          async () =>
            new DeclaredGithubEnvironment({
              repo: { owner: 'ehmpathy', name: 'test-repo' },
              name: 'production',
              reviewers: {
                users: ['alice', 'bob', 'charlie', 'dave'],
                teams: ['team-a', 'team-b', 'team-c'],
              },
              waitTimer: null,
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            }),
        );

        expect(error.message).toContain('max 6 reviewers allowed');
        expect(error.message).toContain('7');
        expect(error.message).toMatchSnapshot('reviewers exceeds max error');
      });
    });

    when('[t1] exactly 6 reviewers total', () => {
      then('it should create the domain object', () => {
        const env = new DeclaredGithubEnvironment({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'production',
          reviewers: {
            users: ['alice', 'bob', 'charlie'],
            teams: ['team-a', 'team-b', 'team-c'],
          },
          waitTimer: null,
          deploymentBranchPolicy: null,
          preventSelfReview: false,
        });

        expect(env).toBeInstanceOf(DeclaredGithubEnvironment);
      });
    });
  });
});
