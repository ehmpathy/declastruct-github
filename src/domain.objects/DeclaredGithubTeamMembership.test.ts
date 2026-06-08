import { given, then, when } from 'test-fns';

import { DeclaredGithubTeamMembership } from './DeclaredGithubTeamMembership';

describe('DeclaredGithubTeamMembership', () => {
  given('[case1] valid config', () => {
    when('[t0] created with member role', () => {
      then('it should create the domain object', () => {
        const membership = new DeclaredGithubTeamMembership({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'platform-engineers',
          },
          username: 'testuser',
          role: 'member',
        });

        expect(membership).toBeInstanceOf(DeclaredGithubTeamMembership);
        expect(membership.team).toEqual({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
        });
        expect(membership.username).toEqual('testuser');
        expect(membership.role).toEqual('member');
        expect(membership).toMatchSnapshot();
      });
    });

    when('[t1] created with maintainer role', () => {
      then('it should create the domain object', () => {
        const membership = new DeclaredGithubTeamMembership({
          team: {
            org: { login: 'ehmpathy' },
            slug: 'platform-engineers',
          },
          username: 'leaduser',
          role: 'maintainer',
        });

        expect(membership).toBeInstanceOf(DeclaredGithubTeamMembership);
        expect(membership.role).toEqual('maintainer');
        expect(membership).toMatchSnapshot();
      });
    });
  });
});
