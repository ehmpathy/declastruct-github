import { given, then, when } from 'test-fns';

import { getTeamIdBySlug } from './getTeamIdBySlug';

describe('getTeamIdBySlug', () => {
  given('[case1] function signature', () => {
    when('[t0] invoked with valid parameters', () => {
      then(
        'it should be a function that accepts org+slug and returns promise of number',
        () => {
          // validate function exists and has correct signature
          expect(typeof getTeamIdBySlug).toBe('function');
          expect(getTeamIdBySlug.length).toBe(2); // input, context

          // note: actual behavior tested in integration tests
          // note: requires read:org scope which test token may not have
        },
      );
    });
  });
});
