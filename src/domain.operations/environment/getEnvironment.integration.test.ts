import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';

import { getEnvironment } from './getEnvironment';

const log = console;

describe('getEnvironment', () => {
  const context = { log, ...getSampleGithubContext() };
  const repo = { owner: 'ehmpathy', name: 'declastruct-github-demo' };

  given('[case1] environment that does not exist', () => {
    when('[t0] fetched by unique', () => {
      then('it should return null', async () => {
        const result = await getEnvironment(
          {
            by: {
              unique: {
                repo,
                name: 'nonexistent-environment-12345',
              },
            },
          },
          context,
        );

        expect(result).toBeNull();
        expect(result).toMatchSnapshot('not-found returns null');
      });
    });
  });

  given('[case2] by.ref dispatch', () => {
    when('[t0] fetched by ref (unique key)', () => {
      then('it should dispatch to by.unique', async () => {
        const result = await getEnvironment(
          {
            by: {
              ref: {
                repo,
                name: 'nonexistent-environment-12345',
              },
            },
          },
          context,
        );

        expect(result).toBeNull();
        expect(result).toMatchSnapshot('not-found via ref returns null');
      });
    });
  });

  // note: positive cases (environment exists) tested in environment.play.integration.test.ts
  // those tests create, fetch, and delete environments in a full lifecycle
});
