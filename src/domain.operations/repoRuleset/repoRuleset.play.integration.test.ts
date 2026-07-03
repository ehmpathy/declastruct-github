import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { delRepoRuleset } from './delRepoRuleset';
import { getRepoRuleset } from './getRepoRuleset';
import { setRepoRuleset } from './setRepoRuleset';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });

describe('repo ruleset lifecycle', () => {
  const repo = { owner: 'ehmpathy', name: 'declastruct-github-demo' };

  given('[case1] full tag-protection ruleset lifecycle', () => {
    // unique name per test run to avoid collision
    const rulesetName = `test-tag-ruleset-${Date.now()}`;

    when('[t0] lifecycle operations are executed', () => {
      then(
        'should complete create, read, idempotent findsert, upsert, delete',
        async () => {
          // step 1: verify ruleset does not exist
          const before = await getRepoRuleset(
            { by: { unique: { repo, name: rulesetName } } },
            getContext(),
          );
          expect(before).toBeNull();
          expect(before).toMatchSnapshot('ruleset not-found returns null');

          // step 2: create ruleset via findsert — restrict v* tag creation
          const created = await setRepoRuleset(
            {
              findsert: {
                repo,
                name: rulesetName,
                target: 'tag',
                enforcement: 'active',
                bypassActors: [],
                conditions: {
                  refNameInclude: ['refs/tags/v*'],
                  refNameExclude: [],
                },
                rules: [{ type: 'creation' }],
              },
            },
            getContext(),
          );
          expect(created).toBeDefined();
          expect(created.name).toBe(rulesetName);
          expect(created.repo.owner).toBe(repo.owner);
          expect(created.repo.name).toBe(repo.name);
          expect(created.id).toBeDefined();
          expect(created.target).toBe('tag');
          expect(created.rules).toEqual([{ type: 'creation' }]);
          // snapshot for created shape (excludes dynamic name and id)
          expect({
            repo: created.repo,
            target: created.target,
            enforcement: created.enforcement,
            bypassActors: created.bypassActors,
            conditions: created.conditions,
            rules: created.rules,
          }).toMatchSnapshot('ruleset after create');

          // step 3: fetch after creation
          const fetched = await getRepoRuleset(
            { by: { unique: { repo, name: rulesetName } } },
            getContext(),
          );
          expect(fetched).not.toBeNull();
          expect(fetched!.name).toBe(rulesetName);
          expect(fetched!.conditions).toEqual({
            refNameInclude: ['refs/tags/v*'],
            refNameExclude: [],
          });
          expect({
            repo: fetched!.repo,
            target: fetched!.target,
            enforcement: fetched!.enforcement,
            bypassActors: fetched!.bypassActors,
            conditions: fetched!.conditions,
            rules: fetched!.rules,
          }).toMatchSnapshot('ruleset after fetch');

          // step 4: findsert again (idempotent — should not update)
          const findsertAgain = await setRepoRuleset(
            {
              findsert: {
                repo,
                name: rulesetName,
                target: 'tag',
                enforcement: 'disabled', // different value, should be ignored
                bypassActors: [],
                conditions: {
                  refNameInclude: ['refs/tags/v*'],
                  refNameExclude: [],
                },
                rules: [{ type: 'creation' }],
              },
            },
            getContext(),
          );
          expect(findsertAgain.enforcement).toBe('active'); // unchanged
          expect({
            repo: findsertAgain.repo,
            target: findsertAgain.target,
            enforcement: findsertAgain.enforcement,
            bypassActors: findsertAgain.bypassActors,
            conditions: findsertAgain.conditions,
            rules: findsertAgain.rules,
          }).toMatchSnapshot('ruleset after idempotent findsert');

          // step 5: upsert (should update enforcement)
          const upserted = await setRepoRuleset(
            {
              upsert: {
                repo,
                name: rulesetName,
                target: 'tag',
                enforcement: 'evaluate',
                bypassActors: [],
                conditions: {
                  refNameInclude: ['refs/tags/v*'],
                  refNameExclude: [],
                },
                rules: [{ type: 'creation' }],
              },
            },
            getContext(),
          );
          expect(upserted.enforcement).toBe('evaluate');
          expect({
            repo: upserted.repo,
            target: upserted.target,
            enforcement: upserted.enforcement,
            bypassActors: upserted.bypassActors,
            conditions: upserted.conditions,
            rules: upserted.rules,
          }).toMatchSnapshot('ruleset after upsert');

          // step 6: delete
          await delRepoRuleset(
            { by: { ref: { repo, name: rulesetName } } },
            getContext(),
          );

          // step 7: verify deleted
          const afterDelete = await getRepoRuleset(
            { by: { unique: { repo, name: rulesetName } } },
            getContext(),
          );
          expect(afterDelete).toBeNull();
          expect(afterDelete).toMatchSnapshot(
            'ruleset after delete returns null',
          );
        },
      );
    });
  });

  given('[case2] delete is idempotent for an absent ruleset', () => {
    const absentName = `test-absent-ruleset-${Date.now()}`;

    when('[t0] delete is called for a ruleset that does not exist', () => {
      then('it should no-op and the ruleset stays absent', async () => {
        // delete an absent ruleset — should not throw
        await delRepoRuleset(
          { by: { ref: { repo, name: absentName } } },
          getContext(),
        );

        // verify the ruleset is still absent (delete was a genuine no-op)
        const afterDelete = await getRepoRuleset(
          { by: { unique: { repo, name: absentName } } },
          getContext(),
        );
        expect(afterDelete).toBeNull();
      });
    });
  });
});
