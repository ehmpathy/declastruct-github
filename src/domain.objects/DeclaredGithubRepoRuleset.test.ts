import { given, then, when } from 'test-fns';

import { DeclaredGithubRepoRuleset } from './DeclaredGithubRepoRuleset';

describe('DeclaredGithubRepoRuleset', () => {
  given('[case1] a tag-protection ruleset with a bypass actor', () => {
    when('[t0] created with all fields', () => {
      then('it should create the domain object', () => {
        const ruleset = new DeclaredGithubRepoRuleset({
          repo: { owner: 'ehmpathy', name: 'test-repo' },
          name: 'protect-version-tags',
          target: 'tag',
          enforcement: 'active',
          bypassActors: [
            { actorId: 123456, actorType: 'Integration', bypassMode: 'always' },
          ],
          conditions: {
            refNameInclude: ['refs/tags/v*'],
            refNameExclude: [],
          },
          rules: [{ type: 'creation' }],
        });

        expect(ruleset).toBeInstanceOf(DeclaredGithubRepoRuleset);
        expect(ruleset.repo).toEqual({ owner: 'ehmpathy', name: 'test-repo' });
        expect(ruleset.name).toEqual('protect-version-tags');
        expect(ruleset.target).toEqual('tag');
        expect(ruleset.enforcement).toEqual('active');
        expect(ruleset.bypassActors).toEqual([
          { actorId: 123456, actorType: 'Integration', bypassMode: 'always' },
        ]);
        expect(ruleset.conditions).toEqual({
          refNameInclude: ['refs/tags/v*'],
          refNameExclude: [],
        });
        expect(ruleset.rules).toEqual([{ type: 'creation' }]);
      });
    });
  });

  given(
    '[case2] a branch ruleset with empty bypass actors and null conditions',
    () => {
      when('[t0] created with minimal fields', () => {
        then('it should create the domain object', () => {
          const ruleset = new DeclaredGithubRepoRuleset({
            repo: { owner: 'ehmpathy', name: 'test-repo' },
            name: 'require-linear-history',
            target: 'branch',
            enforcement: 'evaluate',
            bypassActors: [],
            conditions: null,
            rules: [{ type: 'required_linear_history' }],
          });

          expect(ruleset).toBeInstanceOf(DeclaredGithubRepoRuleset);
          expect(ruleset.bypassActors).toEqual([]);
          expect(ruleset.conditions).toBeNull();
          expect(ruleset.target).toEqual('branch');
        });
      });
    },
  );

  given('[case3] the unique and primary key declarations', () => {
    when('[t0] inspected', () => {
      then('unique is [repo, name] and primary is [id]', () => {
        expect(DeclaredGithubRepoRuleset.unique).toEqual(['repo', 'name']);
        expect(DeclaredGithubRepoRuleset.primary).toEqual(['id']);
      });
    });
  });
});
