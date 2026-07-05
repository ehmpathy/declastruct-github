import { given, then, when } from 'test-fns';

import { DeclaredGithubOrgRuleset } from './DeclaredGithubOrgRuleset';

describe('DeclaredGithubOrgRuleset', () => {
  given(
    '[case1] an org-wide tag-protection ruleset with a bypass actor',
    () => {
      when('[t0] created with all fields', () => {
        then('it should create the domain object', () => {
          const ruleset = new DeclaredGithubOrgRuleset({
            org: { login: 'ehmpathy' },
            name: 'org-protect-version-tags',
            target: 'tag',
            enforcement: 'active',
            bypassActors: [
              {
                actorId: 2472031,
                actorType: 'Integration',
                bypassMode: 'always',
              },
            ],
            conditions: {
              refNameInclude: ['refs/tags/v*'],
              refNameExclude: [],
              repositoryNameInclude: ['~ALL'],
              repositoryNameExclude: [],
              repositoryNameProtected: false,
            },
            rules: [{ type: 'creation' }],
          });

          expect(ruleset).toBeInstanceOf(DeclaredGithubOrgRuleset);
          expect(ruleset.org).toEqual({ login: 'ehmpathy' });
          expect(ruleset.name).toEqual('org-protect-version-tags');
          expect(ruleset.target).toEqual('tag');
          expect(ruleset.enforcement).toEqual('active');
          expect(ruleset.bypassActors).toEqual([
            {
              actorId: 2472031,
              actorType: 'Integration',
              bypassMode: 'always',
            },
          ]);
          expect(ruleset.conditions).toEqual({
            refNameInclude: ['refs/tags/v*'],
            refNameExclude: [],
            repositoryNameInclude: ['~ALL'],
            repositoryNameExclude: [],
            repositoryNameProtected: false,
          });
          expect(ruleset.rules).toEqual([{ type: 'creation' }]);
        });
      });
    },
  );

  given(
    '[case2] a branch ruleset scoped to selected repos with empty bypass actors',
    () => {
      when('[t0] created with a repositoryName glob condition', () => {
        then('it should create the domain object', () => {
          const ruleset = new DeclaredGithubOrgRuleset({
            org: { login: 'ehmpathy' },
            name: 'org-require-linear-history',
            target: 'branch',
            enforcement: 'evaluate',
            bypassActors: [],
            conditions: {
              refNameInclude: ['~DEFAULT_BRANCH'],
              refNameExclude: [],
              repositoryNameInclude: ['svc-*'],
              repositoryNameExclude: ['*-sandbox'],
              repositoryNameProtected: true,
            },
            rules: [{ type: 'required_linear_history' }],
          });

          expect(ruleset).toBeInstanceOf(DeclaredGithubOrgRuleset);
          expect(ruleset.bypassActors).toEqual([]);
          expect(ruleset.conditions?.repositoryNameInclude).toEqual(['svc-*']);
          expect(ruleset.conditions?.repositoryNameExclude).toEqual([
            '*-sandbox',
          ]);
          expect(ruleset.conditions?.repositoryNameProtected).toEqual(true);
          expect(ruleset.target).toEqual('branch');
        });
      });
    },
  );

  given('[case3] a ruleset with null conditions', () => {
    when('[t0] created with minimal fields', () => {
      then('it should create the domain object with null conditions', () => {
        const ruleset = new DeclaredGithubOrgRuleset({
          org: { login: 'ehmpathy' },
          name: 'org-bare',
          target: 'branch',
          enforcement: 'disabled',
          bypassActors: [],
          conditions: null,
          rules: [],
        });

        expect(ruleset.conditions).toBeNull();
        expect(ruleset.rules).toEqual([]);
      });
    });
  });

  given('[case4] the unique and primary key declarations', () => {
    when('[t0] inspected', () => {
      then('unique is [org, name] and primary is [id]', () => {
        expect(DeclaredGithubOrgRuleset.unique).toEqual(['org', 'name']);
        expect(DeclaredGithubOrgRuleset.primary).toEqual(['id']);
      });
    });
  });
});
