import { given, then, when } from 'test-fns';

import { DeclaredGithubOrgVariable } from '../../domain.objects/DeclaredGithubOrgVariable';
import { castToDeclaredGithubOrgVariable } from './castToDeclaredGithubOrgVariable';

describe('castToDeclaredGithubOrgVariable', () => {
  given('a GitHub API variable response', () => {
    const org = { login: 'test-org' };

    when('all fields are present', () => {
      const data = {
        name: 'TEST_VAR',
        value: 'test-value',
        visibility: 'private',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      then('it should cast to DeclaredGithubOrgVariable', () => {
        const result = castToDeclaredGithubOrgVariable({
          data: data as any,
          org,
        });

        expect(result).toBeInstanceOf(DeclaredGithubOrgVariable);
        expect(result.org).toEqual(org);
        expect(result.name).toEqual('TEST_VAR');
        expect(result.value).toEqual('test-value');
        expect(result.visibility).toEqual('private');
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    when('visibility is "all"', () => {
      const data = {
        name: 'PUBLIC_VAR',
        value: 'public-value',
        visibility: 'all',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      then('it should preserve visibility', () => {
        const result = castToDeclaredGithubOrgVariable({
          data: data as any,
          org,
        });

        expect(result.visibility).toEqual('all');
      });
    });

    when('visibility is "selected"', () => {
      const data = {
        name: 'SELECTED_VAR',
        value: 'selected-value',
        visibility: 'selected',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      then('it should set selectedRepositoryNames to undefined', () => {
        const result = castToDeclaredGithubOrgVariable({
          data: data as any,
          org,
        });

        expect(result.visibility).toEqual('selected');
        expect(result.selectedRepositoryNames).toBeUndefined();
      });
    });
  });
});
