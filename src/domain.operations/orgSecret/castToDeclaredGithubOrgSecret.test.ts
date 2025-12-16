import { given, then, when } from 'test-fns';

import { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';

import { castToDeclaredGithubOrgSecret } from './castToDeclaredGithubOrgSecret';

describe('castToDeclaredGithubOrgSecret', () => {
  given('a GitHub API secret response', () => {
    const org = { login: 'test-org' };

    when('all metadata fields are present', () => {
      const data = {
        name: 'TEST_SECRET',
        visibility: 'private',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      then(
        'it should cast to DeclaredGithubOrgSecret with value undefined',
        () => {
          const result = castToDeclaredGithubOrgSecret({
            data: data as any,
            org,
          });

          expect(result).toBeInstanceOf(DeclaredGithubOrgSecret);
          expect(result.org).toEqual(org);
          expect(result.name).toEqual('TEST_SECRET');
          expect(result.value).toBeUndefined();
          expect(result.visibility).toEqual('private');
          expect(result.createdAt).toBeDefined();
          expect(result.updatedAt).toBeDefined();
        },
      );
    });

    when('visibility is "all"', () => {
      const data = {
        name: 'PUBLIC_SECRET',
        visibility: 'all',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      then('it should preserve visibility and never return value', () => {
        const result = castToDeclaredGithubOrgSecret({
          data: data as any,
          org,
        });

        expect(result.visibility).toEqual('all');
        expect(result.value).toBeUndefined();
      });
    });

    when('visibility is "selected"', () => {
      const data = {
        name: 'SELECTED_SECRET',
        visibility: 'selected',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      then('it should set selectedRepositoryNames to undefined', () => {
        const result = castToDeclaredGithubOrgSecret({
          data: data as any,
          org,
        });

        expect(result.visibility).toEqual('selected');
        expect(result.selectedRepositoryNames).toBeUndefined();
        expect(result.value).toBeUndefined();
      });
    });
  });
});
