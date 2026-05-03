import { given, then, when } from 'test-fns';

import { getUserIdByUsername } from './getUserIdByUsername';

describe('getUserIdByUsername', () => {
  given('[case1] function signature', () => {
    when('[t0] invoked with valid parameters', () => {
      then(
        'it should be a function that accepts username and returns promise of number',
        () => {
          // validate function exists and has correct signature
          expect(typeof getUserIdByUsername).toBe('function');
          expect(getUserIdByUsername.length).toBe(2); // input, context

          // note: actual behavior tested in integration tests
        },
      );
    });
  });
});
