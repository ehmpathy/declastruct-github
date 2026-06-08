import { given, then, when } from 'test-fns';

import { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';

import { castToDeclaredGithubTeam } from './castToDeclaredGithubTeam';

describe('castToDeclaredGithubTeam', () => {
  given('a GitHub API team response', () => {
    when('all fields are present with closed privacy', () => {
      const data = {
        id: 12345,
        slug: 'platform-engineers',
        name: 'Platform Engineers',
        description: 'core platform team',
        privacy: 'closed',
        notification_setting: 'notifications_enabled',
        parent: null,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-06-01T14:45:00Z',
      };

      then('it should cast to DeclaredGithubTeam with all fields', () => {
        const result = castToDeclaredGithubTeam({
          data: data as any,
          org: 'ehmpathy',
        });

        expect(result).toBeInstanceOf(DeclaredGithubTeam);
        expect(result.id).toEqual(12345);
        expect(result.createdAt).toEqual('2024-01-15T10:30:00.000Z');
        expect(result.updatedAt).toEqual('2024-06-01T14:45:00.000Z');
        expect(result.org).toEqual({ login: 'ehmpathy' });
        expect(result.slug).toEqual('platform-engineers');
        expect(result.name).toEqual('Platform Engineers');
        expect(result.description).toEqual('core platform team');
        expect(result.privacy).toEqual('closed');
        expect(result.notifications).toEqual('enabled');
        expect(result.parent).toBeNull();
        expect(result).toMatchSnapshot();
      });
    });

    when('team has a parent team', () => {
      const data = {
        id: 12346,
        slug: 'backend-engineers',
        name: 'Backend Engineers',
        description: 'backend subteam',
        privacy: 'closed',
        notification_setting: 'notifications_disabled',
        parent: { slug: 'platform-engineers' },
      };

      then('it should cast parent as RefByUnique', () => {
        const result = castToDeclaredGithubTeam({
          data: data as any,
          org: 'ehmpathy',
        });

        expect(result.parent).toEqual({
          org: { login: 'ehmpathy' },
          slug: 'platform-engineers',
        });
        expect(result.notifications).toEqual('disabled');
        expect(result).toMatchSnapshot();
      });
    });

    when('privacy is secret', () => {
      const data = {
        id: 12347,
        slug: 'security-team',
        name: 'Security Team',
        description: null,
        privacy: 'secret',
        notification_setting: 'notifications_disabled',
        parent: null,
      };

      then('it should cast with secret privacy', () => {
        const result = castToDeclaredGithubTeam({
          data: data as any,
          org: 'ehmpathy',
        });

        expect(result.privacy).toEqual('secret');
        expect(result.description).toBeNull();
        expect(result).toMatchSnapshot();
      });
    });

    when('notification_setting has unexpected value', () => {
      const data = {
        id: 12348,
        slug: 'test-team',
        name: 'Test Team',
        description: null,
        privacy: 'closed',
        notification_setting: 'something_else',
        parent: null,
      };

      then('it should default to disabled', () => {
        const result = castToDeclaredGithubTeam({
          data: data as any,
          org: 'ehmpathy',
        });

        expect(result.notifications).toEqual('disabled');
        expect(result).toMatchSnapshot();
      });
    });
  });
});
