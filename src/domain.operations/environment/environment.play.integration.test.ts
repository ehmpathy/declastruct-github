import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { delEnvironment } from './delEnvironment';
import { getEnvironment } from './getEnvironment';
import { setEnvironment } from './setEnvironment';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('environment lifecycle', () => {
  const repo = { owner: 'ehmpathy', name: 'declastruct-github-demo' };

  given('[case1] full environment lifecycle', () => {
    // unique name per test run to avoid collision
    const envName = `test-env-${Date.now()}`;

    when('[t0] lifecycle operations are executed', () => {
      then('should complete create, read, update, delete', async () => {
        // step 1: verify environment does not exist
        const envBefore = await getEnvironment(
          { by: { unique: { repo, name: envName } } },
          getContext(),
        );
        expect(envBefore).toBeNull();
        // snapshot for not-found case
        expect(envBefore).toMatchSnapshot('environment not-found returns null');

        // step 2: create environment via findsert
        const envCreated = await setEnvironment(
          {
            findsert: {
              repo,
              name: envName,
              reviewers: null,
              waitTimer: null,
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            },
          },
          getContext(),
        );
        expect(envCreated).toBeDefined();
        expect(envCreated.name).toBe(envName);
        expect(envCreated.repo.owner).toBe(repo.owner);
        expect(envCreated.repo.name).toBe(repo.name);
        expect(envCreated.id).toBeDefined();
        // snapshot for created environment shape (excludes dynamic name and id)
        expect({
          repo: envCreated.repo,
          reviewers: envCreated.reviewers,
          waitTimer: envCreated.waitTimer,
          deploymentBranchPolicy: envCreated.deploymentBranchPolicy,
          preventSelfReview: envCreated.preventSelfReview,
        }).toMatchSnapshot('environment after create');

        // step 3: fetch environment after creation
        const envFetched = await getEnvironment(
          { by: { unique: { repo, name: envName } } },
          getContext(),
        );
        expect(envFetched).not.toBeNull();
        expect(envFetched!.name).toBe(envName);
        // snapshot for fetched environment shape (excludes dynamic name and id)
        expect({
          repo: envFetched!.repo,
          reviewers: envFetched!.reviewers,
          waitTimer: envFetched!.waitTimer,
          deploymentBranchPolicy: envFetched!.deploymentBranchPolicy,
          preventSelfReview: envFetched!.preventSelfReview,
        }).toMatchSnapshot('environment after fetch');

        // step 4: findsert again (idempotent - should not update)
        const envFindsertAgain = await setEnvironment(
          {
            findsert: {
              repo,
              name: envName,
              reviewers: null,
              waitTimer: 5, // different value, should be ignored
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            },
          },
          getContext(),
        );
        expect(envFindsertAgain).toBeDefined();
        expect(envFindsertAgain.name).toBe(envName);
        // findsert does not update, so waitTimer should still be null
        expect(envFindsertAgain.waitTimer).toBeNull();
        expect(envFindsertAgain.preventSelfReview).toBe(false);
        // snapshot for findsert idempotent return (excludes dynamic name and id)
        expect({
          repo: envFindsertAgain.repo,
          reviewers: envFindsertAgain.reviewers,
          waitTimer: envFindsertAgain.waitTimer,
          deploymentBranchPolicy: envFindsertAgain.deploymentBranchPolicy,
          preventSelfReview: envFindsertAgain.preventSelfReview,
        }).toMatchSnapshot('environment after idempotent findsert');

        // step 5: upsert (should update)
        // note: preventSelfReview is ignored when no reviewers (GitHub API constraint)
        const envUpserted = await setEnvironment(
          {
            upsert: {
              repo,
              name: envName,
              reviewers: null,
              waitTimer: 10,
              deploymentBranchPolicy: null,
              preventSelfReview: false,
            },
          },
          getContext(),
        );
        expect(envUpserted).toBeDefined();
        expect(envUpserted.name).toBe(envName);
        expect(envUpserted.waitTimer).toBe(10);
        expect(envUpserted.preventSelfReview).toBe(false);
        // snapshot for upserted environment shape (excludes dynamic name and id)
        expect({
          repo: envUpserted.repo,
          reviewers: envUpserted.reviewers,
          waitTimer: envUpserted.waitTimer,
          deploymentBranchPolicy: envUpserted.deploymentBranchPolicy,
          preventSelfReview: envUpserted.preventSelfReview,
        }).toMatchSnapshot('environment after upsert');

        // step 6: delete environment
        await delEnvironment(
          { by: { ref: { repo, name: envName } } },
          getContext(),
        );

        // step 7: verify environment is deleted
        const envAfterDelete = await getEnvironment(
          { by: { unique: { repo, name: envName } } },
          getContext(),
        );
        expect(envAfterDelete).toBeNull();
        // snapshot for deleted state (same as not-found)
        expect(envAfterDelete).toMatchSnapshot(
          'environment after delete returns null',
        );
      });
    });
  });

  given('[case2] environment with reviewers', () => {
    const envName = `test-env-rev-${Date.now()}`;

    when('[t0] reviewer operations are executed', () => {
      then('should create environment with user reviewer', async () => {
        // create environment with user reviewer
        // note: 'uladkasach' is owner of the demo repo
        const envCreated = await setEnvironment(
          {
            findsert: {
              repo,
              name: envName,
              reviewers: {
                users: ['uladkasach'],
                teams: null,
              },
              waitTimer: null,
              deploymentBranchPolicy: null,
              preventSelfReview: true,
            },
          },
          getContext(),
        );
        expect(envCreated).toBeDefined();
        expect(envCreated.name).toBe(envName);
        expect(envCreated.reviewers).toBeDefined();
        expect(envCreated.reviewers!.users).toContain('uladkasach');
        expect(envCreated.preventSelfReview).toBe(true);
        // snapshot for reviewer environment shape (excludes dynamic name and id)
        expect({
          repo: envCreated.repo,
          reviewers: envCreated.reviewers,
          waitTimer: envCreated.waitTimer,
          deploymentBranchPolicy: envCreated.deploymentBranchPolicy,
          preventSelfReview: envCreated.preventSelfReview,
        }).toMatchSnapshot('environment with reviewer');

        // fetch environment to verify reviewer persisted
        const envFetched = await getEnvironment(
          { by: { unique: { repo, name: envName } } },
          getContext(),
        );
        expect(envFetched).not.toBeNull();
        expect(envFetched!.reviewers).toBeDefined();
        expect(envFetched!.reviewers!.users).toContain('uladkasach');
        // snapshot for fetched environment with reviewer (excludes dynamic name and id)
        expect({
          repo: envFetched!.repo,
          reviewers: envFetched!.reviewers,
          waitTimer: envFetched!.waitTimer,
          deploymentBranchPolicy: envFetched!.deploymentBranchPolicy,
          preventSelfReview: envFetched!.preventSelfReview,
        }).toMatchSnapshot('environment with reviewer after fetch');

        // cleanup: delete environment
        await delEnvironment(
          { by: { ref: { repo, name: envName } } },
          getContext(),
        );
      });
    });
  });

  given('[case3] environment with branch policy', () => {
    const envName = `test-env-bp-${Date.now()}`;

    when('[t0] branch policy operations are executed', () => {
      then('should create and update branch policies', async () => {
        // step 1: create with custom branch policy
        const envCreated = await setEnvironment(
          {
            findsert: {
              repo,
              name: envName,
              reviewers: null,
              waitTimer: null,
              deploymentBranchPolicy: {
                customPatterns: [
                  { name: 'main', target: 'branch' },
                  { name: 'release/*', target: 'branch' },
                ],
              },
              preventSelfReview: false,
            },
          },
          getContext(),
        );
        expect(envCreated.deploymentBranchPolicy).toBeDefined();
        expect(envCreated.deploymentBranchPolicy).toHaveProperty(
          'customPatterns',
        );
        const policy = envCreated.deploymentBranchPolicy as {
          customPatterns: Array<{ name: string; target: 'branch' | 'tag' }>;
        };
        expect(policy.customPatterns).toContainEqual({
          name: 'main',
          target: 'branch',
        });
        expect(policy.customPatterns).toContainEqual({
          name: 'release/*',
          target: 'branch',
        });
        // snapshot for custom branch policy shape (excludes dynamic name and id)
        expect({
          repo: envCreated.repo,
          reviewers: envCreated.reviewers,
          waitTimer: envCreated.waitTimer,
          deploymentBranchPolicy: envCreated.deploymentBranchPolicy,
          preventSelfReview: envCreated.preventSelfReview,
        }).toMatchSnapshot('environment with custom branch policy');

        // step 2: update to protected branches policy
        const envUpdated = await setEnvironment(
          {
            upsert: {
              repo,
              name: envName,
              reviewers: null,
              waitTimer: null,
              deploymentBranchPolicy: {
                protectedBranches: true,
              },
              preventSelfReview: false,
            },
          },
          getContext(),
        );
        expect(envUpdated.deploymentBranchPolicy).toBeDefined();
        expect(envUpdated.deploymentBranchPolicy).toHaveProperty(
          'protectedBranches',
          true,
        );
        // snapshot for updated environment with protected branches (excludes dynamic name and id)
        expect({
          repo: envUpdated.repo,
          reviewers: envUpdated.reviewers,
          waitTimer: envUpdated.waitTimer,
          deploymentBranchPolicy: envUpdated.deploymentBranchPolicy,
          preventSelfReview: envUpdated.preventSelfReview,
        }).toMatchSnapshot('environment updated to protected branches');

        // cleanup: delete environment
        await delEnvironment(
          { by: { ref: { repo, name: envName } } },
          getContext(),
        );
      });
    });
  });

  given('[case4] environment with tag and mixed policies', () => {
    const envName = `test-env-tag-${Date.now()}`;

    // note = assertions only, no snapshots: this case is verified in CI against
    //        the real GitHub API (repo scope), but a local run needs GITHUB_TOKEN
    //        to fill; explicit assertions provide functional verification without
    //        a token-blocked snapshot to pre-generate
    when('[t0] tag and mixed policy operations are executed', () => {
      then(
        'should provision a tag policy, coexist branch+tag, and replace on target change',
        async () => {
          // step 1: create with a tag-only custom policy (the core feature)
          const envCreated = await setEnvironment(
            {
              findsert: {
                repo,
                name: envName,
                reviewers: null,
                waitTimer: null,
                deploymentBranchPolicy: {
                  customPatterns: [{ name: 'v*', target: 'tag' }],
                },
                preventSelfReview: false,
              },
            },
            getContext(),
          );
          const createdPolicy = envCreated.deploymentBranchPolicy as {
            customPatterns: Array<{ name: string; target: 'branch' | 'tag' }>;
          };
          expect(createdPolicy.customPatterns).toContainEqual({
            name: 'v*',
            target: 'tag',
          });

          // step 2: fetch to verify the tag policy round-trips from the API
          const envFetched = await getEnvironment(
            { by: { unique: { repo, name: envName } } },
            getContext(),
          );
          const fetchedPolicy = envFetched!.deploymentBranchPolicy as {
            customPatterns: Array<{ name: string; target: 'branch' | 'tag' }>;
          };
          expect(fetchedPolicy.customPatterns).toContainEqual({
            name: 'v*',
            target: 'tag',
          });

          // step 3: upsert to a mixed branch+tag set; both rows must coexist
          //         under the single custom_branch_policies flag
          await setEnvironment(
            {
              upsert: {
                repo,
                name: envName,
                reviewers: null,
                waitTimer: null,
                deploymentBranchPolicy: {
                  customPatterns: [
                    { name: 'main', target: 'branch' },
                    { name: 'v*', target: 'tag' },
                  ],
                },
                preventSelfReview: false,
              },
            },
            getContext(),
          );
          const envMixed = await getEnvironment(
            { by: { unique: { repo, name: envName } } },
            getContext(),
          );
          const mixedPolicy = envMixed!.deploymentBranchPolicy as {
            customPatterns: Array<{ name: string; target: 'branch' | 'tag' }>;
          };
          expect(mixedPolicy.customPatterns).toContainEqual({
            name: 'main',
            target: 'branch',
          });
          expect(mixedPolicy.customPatterns).toContainEqual({
            name: 'v*',
            target: 'tag',
          });

          // step 4: flip v* from tag to branch; the row is replaced (delete +
          //         create), not duplicated — (name, target) is the identity
          await setEnvironment(
            {
              upsert: {
                repo,
                name: envName,
                reviewers: null,
                waitTimer: null,
                deploymentBranchPolicy: {
                  customPatterns: [{ name: 'v*', target: 'branch' }],
                },
                preventSelfReview: false,
              },
            },
            getContext(),
          );
          const envReplaced = await getEnvironment(
            { by: { unique: { repo, name: envName } } },
            getContext(),
          );
          const replacedPolicy = envReplaced!.deploymentBranchPolicy as {
            customPatterns: Array<{ name: string; target: 'branch' | 'tag' }>;
          };
          expect(replacedPolicy.customPatterns).toContainEqual({
            name: 'v*',
            target: 'branch',
          });
          expect(replacedPolicy.customPatterns).not.toContainEqual({
            name: 'v*',
            target: 'tag',
          });

          // cleanup: delete environment
          await delEnvironment(
            { by: { ref: { repo, name: envName } } },
            getContext(),
          );
        },
      );
    });
  });
});
