import { given, then, when } from 'test-fns';

import { getOneTeamRepoAccess } from './getOneTeamRepoAccess';

describe('getOneTeamRepoAccess', () => {
  /**
   * .note = full lifecycle tests in teamRepoAccess.play.integration.test.ts
   *
   * .note = critical implementation detail:
   *         github's checkPermissionsForRepoInOrg endpoint returns 204 No Content
   *         by default. to get the actual permission data (role_name field), we must
   *         send Accept: application/vnd.github.v3.repository+json header.
   *         without this header, castToDeclaredGithubTeamRepoAccess will throw
   *         "role_name absent in response data".
   *
   *         ref: gh api -X GET /orgs/{org}/teams/{team}/repos/{owner}/{repo} \
   *              -H "Accept: application/vnd.github.v3.repository+json"
   *
   * .note = the integration test verifies permission is returned correctly;
   *         if the Accept header is absent, the test will fail with
   *         "role_name absent in response data"
   */

  given('[case1] function exports', () => {
    when('[t0] imported', () => {
      then('it should be available', () => {
        expect(typeof getOneTeamRepoAccess).toBe('function');
      });
    });
  });
});
