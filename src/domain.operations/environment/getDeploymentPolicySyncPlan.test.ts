import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getDeploymentPolicySyncPlan } from './getDeploymentPolicySyncPlan';

describe('getDeploymentPolicySyncPlan', () => {
  given('[case1] identical desired and extant', () => {
    when('[t0] the desired set already matches live state', () => {
      then('it should be a no-op (empty delete and empty create)', () => {
        const plan = getDeploymentPolicySyncPlan({
          extantPolicies: [
            { id: 1, name: 'main', target: 'branch' },
            { id: 2, name: 'v*', target: 'tag' },
          ],
          desiredPatterns: [
            { name: 'main', target: 'branch' },
            { name: 'v*', target: 'tag' },
          ],
        });

        expect(plan.policiesToDelete).toEqual([]);
        expect(plan.patternsToCreate).toEqual([]);
      });
    });
  });

  given('[case2] a pattern target changes (branch -> tag)', () => {
    when('[t0] the same name flips its target', () => {
      then('it should delete the old row and create the new one', () => {
        const plan = getDeploymentPolicySyncPlan({
          extantPolicies: [{ id: 7, name: 'v*', target: 'branch' }],
          desiredPatterns: [{ name: 'v*', target: 'tag' }],
        });

        // no in-place row-type edit on GitHub: replace via delete + create
        expect(plan.policiesToDelete).toEqual([
          { id: 7, name: 'v*', target: 'branch' },
        ]);
        expect(plan.patternsToCreate).toEqual([{ name: 'v*', target: 'tag' }]);
      });
    });
  });

  given('[case3] a branch and tag of the same name coexist', () => {
    when('[t0] both (v*, branch) and (v*, tag) are desired', () => {
      then('it should treat them as distinct rows', () => {
        const plan = getDeploymentPolicySyncPlan({
          extantPolicies: [{ id: 3, name: 'v*', target: 'branch' }],
          desiredPatterns: [
            { name: 'v*', target: 'branch' },
            { name: 'v*', target: 'tag' },
          ],
        });

        // the branch row already exists, so only the tag row is created
        expect(plan.policiesToDelete).toEqual([]);
        expect(plan.patternsToCreate).toEqual([{ name: 'v*', target: 'tag' }]);
      });
    });
  });

  given('[case4] additions and deletions together', () => {
    when('[t0] the desired set adds one row and drops another', () => {
      then('it should create the new and delete the stale', () => {
        const plan = getDeploymentPolicySyncPlan({
          extantPolicies: [
            { id: 1, name: 'main', target: 'branch' },
            { id: 2, name: 'old-release/*', target: 'branch' },
          ],
          desiredPatterns: [
            { name: 'main', target: 'branch' },
            { name: 'release/*', target: 'branch' },
          ],
        });

        expect(plan.policiesToDelete).toEqual([
          { id: 2, name: 'old-release/*', target: 'branch' },
        ]);
        expect(plan.patternsToCreate).toEqual([
          { name: 'release/*', target: 'branch' },
        ]);
      });
    });
  });

  given('[case5] partial-failure heal (re-apply from partial state)', () => {
    when('[t0] a prior apply created some rows then failed', () => {
      then('re-apply creates only the still-absent row', () => {
        // desired: main + v* ; prior apply created main, failed before v*
        const plan = getDeploymentPolicySyncPlan({
          extantPolicies: [{ id: 1, name: 'main', target: 'branch' }],
          desiredPatterns: [
            { name: 'main', target: 'branch' },
            { name: 'v*', target: 'tag' },
          ],
        });

        // heals: no delete, creates only the still-absent v* tag row
        expect(plan.policiesToDelete).toEqual([]);
        expect(plan.patternsToCreate).toEqual([{ name: 'v*', target: 'tag' }]);
      });
    });
  });

  given('[case6] a stale row has no numeric id', () => {
    when('[t0] an undesired extant row lacks an id', () => {
      then(
        'it should fail loud (undeletable orphan, not a silent skip)',
        () => {
          const error = getError(() =>
            getDeploymentPolicySyncPlan({
              extantPolicies: [{ name: 'stale/*', target: 'branch' }],
              desiredPatterns: [{ name: 'main', target: 'branch' }],
            }),
          );

          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain('no id');
        },
      );
    });

    when('[t1] a desired extant row lacks an id', () => {
      then(
        'it should not error (not stale, so never a delete candidate)',
        () => {
          const plan = getDeploymentPolicySyncPlan({
            extantPolicies: [{ name: 'main', target: 'branch' }],
            desiredPatterns: [{ name: 'main', target: 'branch' }],
          });

          expect(plan.policiesToDelete).toEqual([]);
          expect(plan.patternsToCreate).toEqual([]);
        },
      );
    });
  });
});
