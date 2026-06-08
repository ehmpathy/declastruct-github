import { given, then, when } from 'test-fns';

import { getOneTeam } from './getOneTeam';

describe('getOneTeam', () => {
  // note: full lifecycle tests in team.play.integration.test.ts
  // this file contains targeted tests for specific behaviors

  given('[case1] function exports', () => {
    when('[t0] imported', () => {
      then('it should be available', () => {
        expect(typeof getOneTeam).toBe('function');
      });
    });
  });

  // lifecycle tests for error cases and edge cases
  // are covered in team.play.integration.test.ts
  // to avoid team pollution between test files
});
