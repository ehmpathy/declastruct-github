import { given, then, when } from 'test-fns';

import { DeclaredGithubRepoRuleset } from '@src/domain.objects/DeclaredGithubRepoRuleset';

import {
  castToDeclaredGithubRepoRuleset,
  type GithubRepoRulesetResponse,
} from './castToDeclaredGithubRepoRuleset';

describe('castToDeclaredGithubRepoRuleset', () => {
  const repo = { owner: 'ehmpathy', name: 'test-repo' };

  given('[case1] a full tag ruleset response', () => {
    const response = {
      id: 42,
      name: 'protect-version-tags',
      target: 'tag',
      enforcement: 'active',
      bypass_actors: [
        {
          actor_id: 123456,
          actor_type: 'Integration',
          bypass_mode: 'always',
        },
      ],
      conditions: {
        ref_name: { include: ['refs/tags/v*'], exclude: [] },
      },
      rules: [{ type: 'creation' }],
    } as unknown as GithubRepoRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('it maps snake_case to camelCase and preserves values', () => {
        const result = castToDeclaredGithubRepoRuleset({ response, repo });

        expect(result).toBeInstanceOf(DeclaredGithubRepoRuleset);
        expect(result.id).toEqual(42);
        expect(result.repo).toEqual(repo);
        expect(result.name).toEqual('protect-version-tags');
        expect(result.target).toEqual('tag');
        expect(result.enforcement).toEqual('active');
        expect(result.bypassActors).toEqual([
          { actorId: 123456, actorType: 'Integration', bypassMode: 'always' },
        ]);
        expect(result.conditions).toEqual({
          refNameInclude: ['refs/tags/v*'],
          refNameExclude: [],
        });
        expect(result.rules).toEqual([{ type: 'creation' }]);

        // snapshot alongside explicit assertions (snapshot-only would be a failhide)
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] a response with out-of-order rules and bypass actors', () => {
    const response = {
      id: 7,
      name: 'mixed',
      target: 'branch',
      enforcement: 'active',
      bypass_actors: [
        { actor_id: 999, actor_type: 'Team', bypass_mode: 'always' },
        {
          actor_id: 100,
          actor_type: 'Integration',
          bypass_mode: 'pull_request',
        },
      ],
      conditions: { ref_name: { include: ['~ALL'], exclude: [] } },
      rules: [{ type: 'non_fast_forward' }, { type: 'creation' }],
    } as unknown as GithubRepoRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('rules are sorted to a canonical order by type', () => {
        const result = castToDeclaredGithubRepoRuleset({ response, repo });
        expect(result.rules.map((rule) => rule.type)).toEqual([
          'creation',
          'non_fast_forward',
        ]);
      });

      then('bypass actors are sorted to a canonical order by type', () => {
        const result = castToDeclaredGithubRepoRuleset({ response, repo });
        expect(result.bypassActors.map((actor) => actor.actorType)).toEqual([
          'Integration',
          'Team',
        ]);
      });
    });
  });

  given('[case3] a response with no conditions and empty bypass actors', () => {
    const response = {
      id: 9,
      name: 'bare',
      target: 'branch',
      enforcement: 'disabled',
      bypass_actors: [],
      conditions: null,
      rules: [],
    } as unknown as GithubRepoRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('conditions is null and arrays are empty', () => {
        const result = castToDeclaredGithubRepoRuleset({ response, repo });
        expect(result.conditions).toBeNull();
        expect(result.bypassActors).toEqual([]);
        expect(result.rules).toEqual([]);
      });
    });
  });

  given('[case4] a deploy-key bypass actor with a null actor id', () => {
    const response = {
      id: 11,
      name: 'deploykey',
      target: 'branch',
      enforcement: 'active',
      bypass_actors: [
        { actor_id: null, actor_type: 'DeployKey', bypass_mode: 'always' },
      ],
      conditions: null,
      rules: [],
    } as unknown as GithubRepoRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('actorId is preserved as null', () => {
        const result = castToDeclaredGithubRepoRuleset({ response, repo });
        expect(result.bypassActors[0]!.actorId).toBeNull();
      });
    });
  });
});
