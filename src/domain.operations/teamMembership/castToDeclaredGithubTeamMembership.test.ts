import { given, then, when } from 'test-fns';

import { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';

import { castToDeclaredGithubTeamMembership } from './castToDeclaredGithubTeamMembership';

describe('castToDeclaredGithubTeamMembership', () => {
  given('a GitHub API team membership response', () => {
    when('role is member', () => {
      const data = {
        state: 'active',
        role: 'member',
        url: 'https://api.github.com/...',
      };

      then(
        'it should cast to DeclaredGithubTeamMembership with member role',
        () => {
          const result = castToDeclaredGithubTeamMembership({
            data: data as any,
            org: 'ehmpathy',
            teamSlug: 'platform-engineers',
            username: 'testuser',
          });

          expect(result).toBeInstanceOf(DeclaredGithubTeamMembership);
          expect(result.team).toEqual({
            org: { login: 'ehmpathy' },
            slug: 'platform-engineers',
          });
          expect(result.username).toEqual('testuser');
          expect(result.role).toEqual('member');
          expect(result).toMatchSnapshot();
        },
      );
    });

    when('role is maintainer', () => {
      const data = {
        state: 'active',
        role: 'maintainer',
        url: 'https://api.github.com/...',
      };

      then('it should cast with maintainer role', () => {
        const result = castToDeclaredGithubTeamMembership({
          data: data as any,
          org: 'ehmpathy',
          teamSlug: 'platform-engineers',
          username: 'leaduser',
        });

        expect(result.role).toEqual('maintainer');
        expect(result).toMatchSnapshot();
      });
    });

    when('role has unexpected value', () => {
      const data = {
        state: 'active',
        role: 'something_else',
        url: 'https://api.github.com/...',
      };

      then('it should default to member', () => {
        const result = castToDeclaredGithubTeamMembership({
          data: data as any,
          org: 'ehmpathy',
          teamSlug: 'platform-engineers',
          username: 'testuser',
        });

        expect(result.role).toEqual('member');
        expect(result).toMatchSnapshot();
      });
    });
  });
});
