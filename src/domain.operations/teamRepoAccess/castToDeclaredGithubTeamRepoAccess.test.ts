import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { castToDeclaredGithubTeamRepoAccess } from './castToDeclaredGithubTeamRepoAccess';

describe('castToDeclaredGithubTeamRepoAccess', () => {
  given('[case1] github api response with push permission', () => {
    const input = {
      data: {
        id: 123,
        name: 'declastruct-github',
        full_name: 'ehmpathy/declastruct-github',
        role_name: 'push',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'platform-engineers',
      repoOwner: 'ehmpathy',
      repoName: 'declastruct-github',
    };

    when('[t0] cast to domain object', () => {
      then('it should return correct domain object', () => {
        const result = castToDeclaredGithubTeamRepoAccess(input);

        expect(result.team).toEqual({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
        });
        expect(result.repo).toEqual({
          owner: 'ehmpathy',
          name: 'declastruct-github',
        });
        expect(result.permission).toEqual('push');
      });
    });
  });

  given('[case2] github api response with admin permission', () => {
    const input = {
      data: {
        id: 456,
        name: 'infra',
        full_name: 'ehmpathy/infra',
        role_name: 'admin',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'admins',
      repoOwner: 'ehmpathy',
      repoName: 'infra',
    };

    when('[t0] cast to domain object', () => {
      then('it should return admin permission', () => {
        const result = castToDeclaredGithubTeamRepoAccess(input);

        expect(result.permission).toEqual('admin');
      });
    });
  });

  given('[case3] github api response with pull permission', () => {
    const input = {
      data: {
        id: 300,
        name: 'docs',
        full_name: 'ehmpathy/docs',
        role_name: 'pull',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'readers',
      repoOwner: 'ehmpathy',
      repoName: 'docs',
    };

    when('[t0] cast to domain object', () => {
      then('it should return pull permission', () => {
        const result = castToDeclaredGithubTeamRepoAccess(input);

        expect(result.permission).toEqual('pull');
      });
    });
  });

  given('[case4] github api response with triage permission', () => {
    const input = {
      data: {
        id: 400,
        name: 'issues-repo',
        full_name: 'ehmpathy/issues-repo',
        role_name: 'triage',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'support',
      repoOwner: 'ehmpathy',
      repoName: 'issues-repo',
    };

    when('[t0] cast to domain object', () => {
      then('it should return triage permission', () => {
        const result = castToDeclaredGithubTeamRepoAccess(input);

        expect(result.permission).toEqual('triage');
      });
    });
  });

  given('[case5] github api response with maintain permission', () => {
    const input = {
      data: {
        id: 500,
        name: 'shared-lib',
        full_name: 'ehmpathy/shared-lib',
        role_name: 'maintain',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'maintainers',
      repoOwner: 'ehmpathy',
      repoName: 'shared-lib',
    };

    when('[t0] cast to domain object', () => {
      then('it should return maintain permission', () => {
        const result = castToDeclaredGithubTeamRepoAccess(input);

        expect(result.permission).toEqual('maintain');
      });
    });
  });

  given('[case6] github api response with undefined role_name', () => {
    const input = {
      data: {
        id: 789,
        name: 'docs',
        full_name: 'ehmpathy/docs',
        role_name: undefined,
      } as any,
      org: 'ehmpathy',
      teamSlug: 'readers',
      repoOwner: 'ehmpathy',
      repoName: 'docs',
    };

    when('[t0] cast to domain object', () => {
      then('it should throw because role_name absent', async () => {
        const error = await getError(() =>
          castToDeclaredGithubTeamRepoAccess(input),
        );

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('role_name absent');
      });
    });
  });

  given('[case7] github api response with unrecognized role_name', () => {
    const input = {
      data: {
        id: 101,
        name: 'legacy',
        full_name: 'ehmpathy/legacy',
        role_name: 'unknown_role',
      } as any,
      org: 'ehmpathy',
      teamSlug: 'legacy-team',
      repoOwner: 'ehmpathy',
      repoName: 'legacy',
    };

    when('[t0] cast to domain object', () => {
      then('it should throw on unrecognized permission', async () => {
        const error = await getError(() =>
          castToDeclaredGithubTeamRepoAccess(input),
        );

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('unrecognized permission');
      });
    });
  });
});
