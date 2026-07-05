import { given, then, when } from 'test-fns';

import { DeclaredGithubOrgRuleset } from '@src/domain.objects/DeclaredGithubOrgRuleset';

import {
  castToDeclaredGithubOrgRuleset,
  type GithubOrgRulesetResponse,
} from './castToDeclaredGithubOrgRuleset';

describe('castToDeclaredGithubOrgRuleset', () => {
  const org = { login: 'ehmpathy' };

  given('[case1] a full org tag ruleset response', () => {
    const response = {
      id: 42,
      name: 'org-protect-version-tags',
      target: 'tag',
      enforcement: 'active',
      bypass_actors: [
        {
          actor_id: 2472031,
          actor_type: 'Integration',
          bypass_mode: 'always',
        },
      ],
      conditions: {
        ref_name: { include: ['refs/tags/v*'], exclude: [] },
        repository_name: { include: ['~ALL'], exclude: [], protected: false },
      },
      rules: [{ type: 'creation' }],
    } as unknown as GithubOrgRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('it maps snake_case to camelCase and preserves values', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });

        expect(result).toBeInstanceOf(DeclaredGithubOrgRuleset);
        expect(result.id).toEqual(42);
        expect(result.org).toEqual(org);
        expect(result.name).toEqual('org-protect-version-tags');
        expect(result.target).toEqual('tag');
        expect(result.enforcement).toEqual('active');
        expect(result.bypassActors).toEqual([
          { actorId: 2472031, actorType: 'Integration', bypassMode: 'always' },
        ]);
        expect(result.conditions).toEqual({
          refNameInclude: ['refs/tags/v*'],
          refNameExclude: [],
          repositoryNameInclude: ['~ALL'],
          repositoryNameExclude: [],
          repositoryNameProtected: false,
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
      conditions: {
        ref_name: { include: ['~ALL'], exclude: [] },
        repository_name: { include: ['~ALL'], exclude: [], protected: false },
      },
      rules: [{ type: 'non_fast_forward' }, { type: 'creation' }],
    } as unknown as GithubOrgRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('rules are sorted to a canonical order by type', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result.rules.map((rule) => rule.type)).toEqual([
          'creation',
          'non_fast_forward',
        ]);
      });

      then('bypass actors are sorted to a canonical order by type', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result.bypassActors.map((actor) => actor.actorType)).toEqual([
          'Integration',
          'Team',
        ]);
      });

      then('the canonical-ordered output matches snapshot', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] a response with repository_name only (no ref_name)', () => {
    const response = {
      id: 8,
      name: 'repo-scoped',
      target: 'branch',
      enforcement: 'active',
      bypass_actors: [],
      conditions: {
        repository_name: {
          include: ['svc-*'],
          exclude: ['*-sandbox'],
          protected: true,
        },
      },
      rules: [{ type: 'required_linear_history' }],
    } as unknown as GithubOrgRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('refName arrays are empty and repositoryName is preserved', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result.conditions).toEqual({
          refNameInclude: [],
          refNameExclude: [],
          repositoryNameInclude: ['svc-*'],
          repositoryNameExclude: ['*-sandbox'],
          repositoryNameProtected: true,
        });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case4] a response with no conditions and empty bypass actors', () => {
    const response = {
      id: 9,
      name: 'bare',
      target: 'branch',
      enforcement: 'disabled',
      bypass_actors: [],
      conditions: null,
      rules: [],
    } as unknown as GithubOrgRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('conditions is null and arrays are empty', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result.conditions).toBeNull();
        expect(result.bypassActors).toEqual([]);
        expect(result.rules).toEqual([]);
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] a deploy-key bypass actor with a null actor id', () => {
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
    } as unknown as GithubOrgRulesetResponse;

    when('[t0] cast to the domain object', () => {
      then('actorId is preserved as null', () => {
        const result = castToDeclaredGithubOrgRuleset({ response, org });
        expect(result.bypassActors[0]!.actorId).toBeNull();
        expect(result).toMatchSnapshot();
      });
    });
  });
});
