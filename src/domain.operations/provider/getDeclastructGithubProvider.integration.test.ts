import { genContextLogTrail } from 'sdk-logs';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { DeclaredGithubBranchProtection } from '@src/domain.objects/DeclaredGithubBranchProtection';
import { DeclaredGithubRepoConfig } from '@src/domain.objects/DeclaredGithubRepoConfig';

import { getDeclastructGithubProvider } from './getDeclastructGithubProvider';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .what = integration tests for declastruct github provider
 * .why = validates provider interface works correctly with real github API
 */
describe('getDeclastructGithubProvider', () => {
  given('a declastruct github provider', () => {
    // create provider with credentials (deferred via useBeforeAll to test execution time)
    const provider = useBeforeAll(async () =>
      getDeclastructGithubProvider(
        {
          credentials: {
            token: getSampleGithubContext().github.token,
          },
        },
        { log },
      ),
    );

    then('should have correct name', () => {
      expect(provider.name).toBe('github');
    });

    then('should have all required DAOs', () => {
      expect(provider.daos.DeclaredGithubRepo).toBeDefined();
      expect(provider.daos.DeclaredGithubBranch).toBeDefined();
      expect(provider.daos.DeclaredGithubRepoConfig).toBeDefined();
      expect(provider.daos.DeclaredGithubBranchProtection).toBeDefined();
    });

    then('should have lifecycle hooks', () => {
      expect(provider.hooks.beforeAll).toBeDefined();
      expect(provider.hooks.afterAll).toBeDefined();
    });

    then('should have github context with token', () => {
      expect(provider.context.github.token).toBe(
        getSampleGithubContext().github.token,
      );
    });

    when('using repo dao', () => {
      then('should have get.one.byUnique method', () => {
        expect(provider.daos.DeclaredGithubRepo.get.one.byUnique).toBeDefined();
      });

      then('should have get.one.byRef method', () => {
        expect(provider.daos.DeclaredGithubRepo.get.one.byRef).toBeDefined();
      });

      then('should have set.findsert method', () => {
        expect(provider.daos.DeclaredGithubRepo.set.findsert).toBeDefined();
      });

      then('should have set.upsert method', () => {
        expect(provider.daos.DeclaredGithubRepo.set.upsert).toBeDefined();
      });

      then('can get repo by unique', async () => {
        /**
         * .what = validates byUnique can fetch extant repo from github
         * .why = ensures read operations work correctly via provider interface
         */
        const repo = await provider.daos.DeclaredGithubRepo.get.one.byUnique(
          {
            owner: 'ehmpathy',
            name: 'declastruct-github-demo',
          },
          provider.context,
        );

        // verify repo was fetched
        expect(repo).toBeDefined();
        expect(repo?.name).toBe('declastruct-github-demo');
        expect(repo?.owner).toBe('ehmpathy');
      });
    });

    when('using branch dao', () => {
      then('should have get.one.byUnique method', () => {
        expect(
          provider.daos.DeclaredGithubBranch.get.one.byUnique,
        ).toBeDefined();
      });

      then('should have get.one.byRef method', () => {
        expect(provider.daos.DeclaredGithubBranch.get.one.byRef).toBeDefined();
      });

      then('should have set.findsert method', () => {
        expect(provider.daos.DeclaredGithubBranch.set.findsert).toBeDefined();
      });

      then('should have set.upsert method', () => {
        expect(provider.daos.DeclaredGithubBranch.set.upsert).toBeDefined();
      });

      then('can get branch by unique', async () => {
        /**
         * .what = validates byUnique can fetch extant branch from github
         * .why = ensures read operations work correctly via provider interface
         */
        const branch =
          await provider.daos.DeclaredGithubBranch.get.one.byUnique(
            {
              repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
              name: 'main',
            },
            provider.context,
          );

        // verify branch was fetched
        expect(branch).toBeDefined();
        expect(branch?.name).toBe('main');
      });
    });

    when('using repo config dao', () => {
      then('should have get.one.byUnique method', () => {
        expect(
          provider.daos.DeclaredGithubRepoConfig.get.one.byUnique,
        ).toBeDefined();
      });

      then('should have get.one.byRef method', () => {
        expect(
          provider.daos.DeclaredGithubRepoConfig.get.one.byRef,
        ).toBeDefined();
      });

      then('should have set.findsert method', () => {
        expect(
          provider.daos.DeclaredGithubRepoConfig.set.findsert,
        ).toBeDefined();
      });

      then('should have set.upsert method', () => {
        expect(provider.daos.DeclaredGithubRepoConfig.set.upsert).toBeDefined();
      });

      then('can get repo config by unique', async () => {
        /**
         * .what = validates byUnique can fetch extant repo config from github
         * .why = ensures read operations work correctly via provider interface
         */
        const config =
          await provider.daos.DeclaredGithubRepoConfig.get.one.byUnique(
            {
              repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
            },
            provider.context,
          );

        // verify config was fetched
        expect(config).toBeDefined();
        expect(config?.repo.name).toBe('declastruct-github-demo');
      });

      then('can upsert repo config idempotently', async () => {
        /**
         * .what = validates upsert creates or updates repo config on github
         * .why = ensures write operations work correctly via provider interface
         * .note = uses minimal safe configuration for demo repo
         */
        // define desired repo configuration
        const desiredConfig = DeclaredGithubRepoConfig.as({
          repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
          hasIssues: true,
          hasProjects: false,
          hasWiki: false,
          isTemplate: false,
          defaultBranch: 'main',
          allowSquashMerge: true,
          allowMergeCommit: false,
          allowRebaseMerge: false,
          allowAutoMerge: false,
          deleteBranchOnMerge: true,
          allowUpdateBranch: true,
        });

        // upsert
        const result = await provider.daos.DeclaredGithubRepoConfig.set.upsert!(
          desiredConfig,
          provider.context,
        );

        // verify upsert succeeded
        expect(result).toBeDefined();
        expect(result.repo.name).toBe('declastruct-github-demo');
      });
    });

    when('using branch protection dao', () => {
      then('should have get.one.byUnique method', () => {
        expect(
          provider.daos.DeclaredGithubBranchProtection.get.one.byUnique,
        ).toBeDefined();
      });

      then('should have get.one.byRef method', () => {
        expect(
          provider.daos.DeclaredGithubBranchProtection.get.one.byRef,
        ).toBeDefined();
      });

      then('should have set.findsert method', () => {
        expect(
          provider.daos.DeclaredGithubBranchProtection.set.findsert,
        ).toBeDefined();
      });

      then('should have set.upsert method', () => {
        expect(
          provider.daos.DeclaredGithubBranchProtection.set.upsert,
        ).toBeDefined();
      });

      then('can get branch protection by unique', async () => {
        /**
         * .what = validates byUnique can fetch extant branch protection from github
         * .why = ensures read operations work correctly via provider interface
         */
        const protection =
          await provider.daos.DeclaredGithubBranchProtection.get.one.byUnique(
            {
              branch: {
                repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
                name: 'main',
              },
            },
            provider.context,
          );

        // verify protection was fetched (may be null if not configured)
        expect(protection !== undefined).toBe(true);
      });

      then('can upsert branch protection idempotently', async () => {
        /**
         * .what = validates upsert creates or updates branch protection on github
         * .why = ensures write operations work correctly via provider interface
         * .note = uses idempotent operation safe for demo repo
         */
        // define desired protection configuration
        const desiredProtection = DeclaredGithubBranchProtection.as({
          branch: {
            repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
            name: 'main',
          },
          requiredStatusChecks: null,
          enforceAdmins: false,
          requiredPullRequestReviews: null,
          restrictions: null,
          requireLinearHistory: false,
          allowsForcePushes: false,
          allowsDeletions: false,
          blockCreations: false,
          requiredConversationResolution: false,
          lockBranch: false,
          allowForkSyncing: false,
        });

        // upsert
        const result = await provider.daos.DeclaredGithubBranchProtection.set
          .upsert!(desiredProtection, provider.context);

        // verify upsert succeeded
        expect(result).toBeDefined();
        expect(result.branch.name).toBe('main');
        expect(result.branch.repo.name).toBe('declastruct-github-demo');
      });
    });
  });
});
