import { given, then, when } from 'test-fns';

import { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';

import { castToDeclaredGithubOrg } from './castToDeclaredGithubOrg';

describe('castToDeclaredGithubOrg', () => {
  given('a GitHub API org response', () => {
    when('all fields are present', () => {
      const data = {
        id: 12345,
        login: 'test-org',
        name: 'Test Organization',
        description: 'A test organization',
        billing_email: 'billing@test.org',
        two_factor_requirement_enabled: true,
        public_repos: 42,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      then('it should cast to DeclaredGithubOrg with all fields', () => {
        const result = castToDeclaredGithubOrg({ data: data as any });

        expect(result).toBeInstanceOf(DeclaredGithubOrg);
        expect(result.id).toEqual(12345);
        expect(result.login).toEqual('test-org');
        expect(result.name).toEqual('Test Organization');
        expect(result.description).toEqual('A test organization');
        expect(result.billingEmail).toBeUndefined(); // write-only
        expect(result.twoFactorRequirementEnabled).toEqual(true);
        expect(result.publicRepos).toEqual(42);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    when('optional fields are null/undefined', () => {
      const data = {
        id: 12345,
        login: 'test-org',
        name: null,
        description: null,
        billing_email: null,
        two_factor_requirement_enabled: undefined,
        public_repos: undefined,
        created_at: null,
        updated_at: null,
      };

      then('it should cast with null/undefined values preserved', () => {
        const result = castToDeclaredGithubOrg({ data: data as any });

        expect(result.id).toEqual(12345);
        expect(result.login).toEqual('test-org');
        expect(result.name).toBeNull();
        expect(result.description).toBeNull();
        expect(result.billingEmail).toBeUndefined(); // write-only
        expect(result.twoFactorRequirementEnabled).toBeUndefined();
        expect(result.publicRepos).toBeUndefined();
        expect(result.createdAt).toBeUndefined();
        expect(result.updatedAt).toBeUndefined();
      });
    });
  });
});
