import { getError, given, then, when } from 'test-fns';

import { DeclaredGithubTeam } from './DeclaredGithubTeam';

describe('DeclaredGithubTeam', () => {
  given('[case1] valid config', () => {
    when('[t0] created with all fields', () => {
      then('it should create the domain object', () => {
        const team = new DeclaredGithubTeam({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
          name: 'Platform Engineers',
          description: 'core platform team',
          privacy: 'closed',
          notifications: 'enabled',
          parent: null,
        });

        expect(team).toBeInstanceOf(DeclaredGithubTeam);
        expect(team.org).toEqual({ login: 'ehmpathy' });
        expect(team.slug).toEqual('platform-engineers');
        expect(team.name).toEqual('Platform Engineers');
        expect(team.description).toEqual('core platform team');
        expect(team.privacy).toEqual('closed');
        expect(team.notifications).toEqual('enabled');
        expect(team.parent).toBeNull();
        expect(team).toMatchSnapshot();
      });
    });

    when('[t1] created with parent team', () => {
      then('it should create the domain object', () => {
        const team = new DeclaredGithubTeam({
          org: { login: 'ehmpathy' },
          slug: 'backend-engineers',
          name: 'Backend Engineers',
          description: 'backend subteam',
          privacy: 'closed',
          notifications: 'disabled',
          parent: { org: { login: 'ehmpathy' }, slug: 'platform-engineers' },
        });

        expect(team).toBeInstanceOf(DeclaredGithubTeam);
        expect(team.parent).toEqual({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
        });
        expect(team).toMatchSnapshot();
      });
    });

    when('[t2] created as secret team without parent', () => {
      then('it should create the domain object', () => {
        const team = new DeclaredGithubTeam({
          org: { login: 'ehmpathy' },
          slug: 'security-team',
          name: 'Security Team',
          description: 'internal security',
          privacy: 'secret',
          notifications: 'disabled',
          parent: null,
        });

        expect(team).toBeInstanceOf(DeclaredGithubTeam);
        expect(team.privacy).toEqual('secret');
        expect(team.parent).toBeNull();
        expect(team).toMatchSnapshot();
      });
    });

    when('[t3] created with null description', () => {
      then('it should create the domain object', () => {
        const team = new DeclaredGithubTeam({
          org: { login: 'ehmpathy' },
          slug: 'temp-team',
          name: 'Temp Team',
          description: null,
          privacy: 'closed',
          notifications: 'enabled',
          parent: null,
        });

        expect(team).toBeInstanceOf(DeclaredGithubTeam);
        expect(team.description).toBeNull();
        expect(team).toMatchSnapshot();
      });
    });
  });

  given('[case2] invalid config: secret team with parent', () => {
    when('[t0] privacy is secret and parent is not null', () => {
      then('it should throw validation error', async () => {
        const error = await getError(
          async () =>
            new DeclaredGithubTeam({
              org: { login: 'ehmpathy' },
              slug: 'secret-child',
              name: 'Secret Child',
              description: null,
              privacy: 'secret',
              notifications: 'disabled',
              parent: { org: { login: 'ehmpathy' }, slug: 'parent-team' },
            }),
        );

        expect(error.message).toContain('secret teams cannot have a parent');
        expect(error.message).toMatchSnapshot('secret+parent error');
      });
    });
  });
});
