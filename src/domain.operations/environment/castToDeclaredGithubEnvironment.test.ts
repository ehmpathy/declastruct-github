import { given, then, when } from 'test-fns';

import { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';

import { castToDeclaredGithubEnvironment } from './castToDeclaredGithubEnvironment';

describe('castToDeclaredGithubEnvironment', () => {
  const repo = { owner: 'ehmpathy', name: 'test-repo' };

  given('[case1] valid API response', () => {
    when('[t0] all fields present with user reviewers', () => {
      const data = {
        id: 12345,
        node_id: 'EN_123',
        name: 'production-on-main',
        url: 'https://api.github.com/repos/ehmpathy/test-repo/environments/production-on-main',
        html_url:
          'https://github.com/ehmpathy/test-repo/deployments/activity_log?environment=production-on-main',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        can_admins_bypass: true,
        protection_rules: [
          {
            id: 1,
            node_id: 'PR_1',
            type: 'required_reviewers',
            prevent_self_review: true,
            reviewers: [
              { type: 'User', reviewer: { login: 'alice', id: 100 } },
              { type: 'User', reviewer: { login: 'bob', id: 101 } },
            ],
          },
          {
            id: 2,
            node_id: 'PR_2',
            type: 'wait_timer',
            wait_timer: 30,
          },
        ],
        deployment_branch_policy: {
          protected_branches: false,
          custom_branch_policies: true,
        },
      } as any;

      const branchPolicies = {
        total_count: 1,
        branch_policies: [{ id: 1, node_id: 'BP_1', name: 'main' }],
      };

      then(
        'it should cast to DeclaredGithubEnvironment with all fields',
        () => {
          const result = castToDeclaredGithubEnvironment({
            data,
            branchPolicies,
            repo,
          });

          expect(result).toBeInstanceOf(DeclaredGithubEnvironment);
          expect(result.id).toEqual(12345);
          expect(result.name).toEqual('production-on-main');
          expect(result.reviewers).toEqual({
            users: ['alice', 'bob'],
            teams: null,
          });
          expect(result.waitTimer).toEqual(30);
          expect(result.deploymentBranchPolicy).toEqual({
            customBranches: ['main'],
          });
          expect(result.preventSelfReview).toEqual(true);
          expect(result).toMatchSnapshot('full environment with all fields');
        },
      );
    });

    when('[t1] null reviewers (no protection rules)', () => {
      const data = {
        id: 12346,
        node_id: 'EN_124',
        name: 'prep',
        url: 'https://api.github.com/repos/ehmpathy/test-repo/environments/prep',
        html_url:
          'https://github.com/ehmpathy/test-repo/deployments/activity_log?environment=prep',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        can_admins_bypass: true,
        protection_rules: [],
        deployment_branch_policy: null,
      } as any;

      then('it should cast with null reviewers', () => {
        const result = castToDeclaredGithubEnvironment({
          data,
          branchPolicies: null,
          repo,
        });

        expect(result.reviewers).toBeNull();
        expect(result.waitTimer).toBeNull();
        expect(result.deploymentBranchPolicy).toBeNull();
        expect(result.preventSelfReview).toEqual(false);
        expect(result).toMatchSnapshot('environment with null reviewers');
      });
    });

    when('[t2] protected branches policy', () => {
      const data = {
        id: 12347,
        node_id: 'EN_125',
        name: 'production',
        url: 'https://api.github.com/repos/ehmpathy/test-repo/environments/production',
        html_url:
          'https://github.com/ehmpathy/test-repo/deployments/activity_log?environment=production',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        can_admins_bypass: true,
        protection_rules: [],
        deployment_branch_policy: {
          protected_branches: true,
          custom_branch_policies: false,
        },
      } as any;

      then('it should cast with protectedBranches policy', () => {
        const result = castToDeclaredGithubEnvironment({
          data,
          branchPolicies: null,
          repo,
        });

        expect(result.deploymentBranchPolicy).toEqual({
          protectedBranches: true,
        });
        expect(result).toMatchSnapshot('environment with protected branches');
      });
    });

    when('[t3] custom branch policy with multiple patterns', () => {
      const data = {
        id: 12348,
        node_id: 'EN_126',
        name: 'preview',
        url: 'https://api.github.com/repos/ehmpathy/test-repo/environments/preview',
        html_url:
          'https://github.com/ehmpathy/test-repo/deployments/activity_log?environment=preview',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        can_admins_bypass: true,
        protection_rules: [],
        deployment_branch_policy: {
          protected_branches: false,
          custom_branch_policies: true,
        },
      } as any;

      const branchPolicies = {
        total_count: 2,
        branch_policies: [
          { id: 1, node_id: 'BP_1', name: 'main' },
          { id: 2, node_id: 'BP_2', name: 'release/*' },
        ],
      };

      then('it should extract all branch patterns', () => {
        const result = castToDeclaredGithubEnvironment({
          data,
          branchPolicies,
          repo,
        });

        expect(result.deploymentBranchPolicy).toEqual({
          customBranches: ['main', 'release/*'],
        });
        expect(result).toMatchSnapshot('environment with custom branches');
      });
    });

    when('[t4] team reviewers', () => {
      const data = {
        id: 12349,
        node_id: 'EN_127',
        name: 'prod-team',
        url: 'https://api.github.com/repos/ehmpathy/test-repo/environments/prod-team',
        html_url:
          'https://github.com/ehmpathy/test-repo/deployments/activity_log?environment=prod-team',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        can_admins_bypass: true,
        protection_rules: [
          {
            id: 1,
            node_id: 'PR_1',
            type: 'required_reviewers',
            prevent_self_review: false,
            reviewers: [
              { type: 'Team', reviewer: { slug: 'platform-team', id: 200 } },
              { type: 'User', reviewer: { login: 'alice', id: 100 } },
            ],
          },
        ],
        deployment_branch_policy: null,
      } as any;

      then('it should extract both users and teams', () => {
        const result = castToDeclaredGithubEnvironment({
          data,
          branchPolicies: null,
          repo,
        });

        expect(result.reviewers).toEqual({
          users: ['alice'],
          teams: ['platform-team'],
        });
        expect(result).toMatchSnapshot('environment with team reviewers');
      });
    });
  });
});
