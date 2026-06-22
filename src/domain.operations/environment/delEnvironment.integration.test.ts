import { genContextLogTrail } from 'sdk-logs';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { delEnvironment } from './delEnvironment';

const { log } = genContextLogTrail({ trail: null, env: null });

/**
 * .note = context is deferred to avoid throw when GITHUB_TOKEN is not set in CI
 */
const getContext = () => ({ log, ...getSampleGithubContext() });
describe('delEnvironment', () => {
  const repo = { owner: 'ehmpathy', name: 'declastruct-github-demo' };

  given('[case1] environment that does not exist', () => {
    when('[t0] deleted', () => {
      then('it should not throw (idempotent)', async () => {
        // delete of nonexistent environment should be idempotent
        const result = await delEnvironment(
          {
            by: {
              ref: {
                repo,
                name: 'nonexistent-environment-12345',
              },
            },
          },
          getContext(),
        );

        expect(result).toBeUndefined();
        expect(result).toMatchSnapshot('delete nonexistent returns undefined');
      });
    });
  });

  // note: positive cases (delete extant environment) tested in environment.play.integration.test.ts
  // those tests create and delete environments in a full lifecycle
});
