import { given, then, when } from 'test-fns';

import { setEnvironment } from './setEnvironment';

describe('setEnvironment', () => {
  // note: full lifecycle tests in environment.play.integration.test.ts
  // this file contains targeted tests for specific behaviors

  given('[case1] function exports', () => {
    when('[t0] imported', () => {
      then('it should be available', () => {
        expect(typeof setEnvironment).toBe('function');
      });
    });
  });

  // integration tests for error cases and edge cases
  // are covered in environment.play.integration.test.ts
  // to avoid environment pollution between test files
});
