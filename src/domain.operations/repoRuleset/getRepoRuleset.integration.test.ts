import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getRepoRuleset } from './getRepoRuleset';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });

describe('getRepoRuleset', () => {
  const repo = { owner: 'ehmpathy', name: 'declastruct-github-demo' };

  given('[case1] ruleset that does not exist', () => {
    when('[t0] fetched by unique', () => {
      then('it should return null', async () => {
        const result = await getRepoRuleset(
          {
            by: {
              unique: { repo, name: 'nonexistent-ruleset-12345' },
            },
          },
          getContext(),
        );

        expect(result).toBeNull();
        expect(result).toMatchSnapshot('not-found returns null');
      });
    });
  });

  given('[case2] by.ref dispatch', () => {
    when('[t0] fetched by ref (unique key)', () => {
      then('it should dispatch to by.unique and return null', async () => {
        const result = await getRepoRuleset(
          {
            by: {
              ref: { repo, name: 'nonexistent-ruleset-12345' },
            },
          },
          getContext(),
        );

        expect(result).toBeNull();
        expect(result).toMatchSnapshot('not-found via ref returns null');
      });
    });
  });

  // note: positive cases (ruleset exists) tested in repoRuleset.play.integration.test.ts
  // those tests create, fetch, and delete rulesets in a full lifecycle
});
