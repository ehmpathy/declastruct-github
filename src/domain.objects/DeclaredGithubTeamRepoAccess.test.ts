import { given, then, when } from 'test-fns';

import { DeclaredGithubTeamRepoAccess } from './DeclaredGithubTeamRepoAccess';

describe('DeclaredGithubTeamRepoAccess', () => {
  given('[case1] valid config', () => {
    when('[t0] created with push permission', () => {
      then('it should create the domain object', () => {
        const access = new DeclaredGithubTeamRepoAccess({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'platform-engineers',
          },
          repo: { owner: 'ehmpathy', name: 'declastruct-github' },
          permission: 'push',
        });

        expect(access).toBeInstanceOf(DeclaredGithubTeamRepoAccess);
        expect(access.team).toEqual({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
        });
        expect(access.repo).toEqual({
          owner: 'ehmpathy',
          name: 'declastruct-github',
        });
        expect(access.permission).toEqual('push');
        expect(access).toMatchSnapshot();
      });
    });

    when('[t1] created with admin permission', () => {
      then('it should create the domain object', () => {
        const access = new DeclaredGithubTeamRepoAccess({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'admins',
          },
          repo: { owner: 'ehmpathy', name: 'infra' },
          permission: 'admin',
        });

        expect(access).toBeInstanceOf(DeclaredGithubTeamRepoAccess);
        expect(access.permission).toEqual('admin');
        expect(access).toMatchSnapshot();
      });
    });

    when('[t2] created with pull permission', () => {
      then('it should create the domain object', () => {
        const access = new DeclaredGithubTeamRepoAccess({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'readers',
          },
          repo: { owner: 'ehmpathy', name: 'docs' },
          permission: 'pull',
        });

        expect(access).toBeInstanceOf(DeclaredGithubTeamRepoAccess);
        expect(access.permission).toEqual('pull');
        expect(access).toMatchSnapshot();
      });
    });

    when('[t3] created with triage permission', () => {
      then('it should create the domain object', () => {
        const access = new DeclaredGithubTeamRepoAccess({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'support',
          },
          repo: { owner: 'ehmpathy', name: 'issues' },
          permission: 'triage',
        });

        expect(access).toBeInstanceOf(DeclaredGithubTeamRepoAccess);
        expect(access.permission).toEqual('triage');
        expect(access).toMatchSnapshot();
      });
    });

    when('[t4] created with maintain permission', () => {
      then('it should create the domain object', () => {
        const access = new DeclaredGithubTeamRepoAccess({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'maintainers',
          },
          repo: { owner: 'ehmpathy', name: 'package' },
          permission: 'maintain',
        });

        expect(access).toBeInstanceOf(DeclaredGithubTeamRepoAccess);
        expect(access.permission).toEqual('maintain');
        expect(access).toMatchSnapshot();
      });
    });
  });
});
