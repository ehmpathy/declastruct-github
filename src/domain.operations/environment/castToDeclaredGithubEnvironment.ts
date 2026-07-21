import type { Endpoints } from '@octokit/types';
import type { RefByUnique } from 'domain-objects';
import { MalfunctionError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';
import type { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';

import {
  asDeploymentPolicyTarget,
  type DeploymentPolicyTarget,
} from './asDeploymentPolicyTarget';

type GithubEnvironmentResponse =
  Endpoints['GET /repos/{owner}/{repo}/environments/{environment_name}']['response']['data'];

type GithubBranchPoliciesResponse =
  Endpoints['GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies']['response']['data'];

type GithubProtectionRule = NonNullable<
  GithubEnvironmentResponse['protection_rules']
>[number];

/**
 * .what = extracts reviewers as usernames/slugs from protection rules
 * .why = transforms reviewer IDs back to human-readable identifiers
 *
 * .note = `as any` casts required because @octokit/types protection_rules
 *   type is incomplete — the 'required_reviewers' rule type has `reviewers`
 *   array and `prevent_self_review` fields that are not typed.
 *   removal path: contribute types to @octokit/types or wait for upstream fix.
 *   ref: https://docs.github.com/en/rest/deployments/environments
 */
const extractReviewersFromProtectionRules = (input: {
  protectionRules: GithubEnvironmentResponse['protection_rules'];
}): DeclaredGithubEnvironment['reviewers'] => {
  const protection = input.protectionRules?.find(
    (rule) => rule.type === 'required_reviewers',
  );
  if (!protection) return null;

  // note: cast required — @octokit/types lacks reviewers field on protection rule
  const reviewersList = (protection as any).reviewers ?? [];
  const users: string[] = [];
  const teams: string[] = [];

  for (const reviewer of reviewersList) {
    if (reviewer.type === 'User' && reviewer.reviewer?.login) {
      users.push(reviewer.reviewer.login);
    }
    if (reviewer.type === 'Team' && reviewer.reviewer?.slug) {
      teams.push(reviewer.reviewer.slug);
    }
  }

  if (users.length === 0 && teams.length === 0) return null;
  return {
    users: users.length > 0 ? users : null,
    teams: teams.length > 0 ? teams : null,
  };
};

/**
 * .what = extracts wait timer minutes from protection rules
 * .why = decodes the wait_timer rule type to a simple number
 *
 * .note = `as any` cast required because @octokit/types protection_rules
 *   type is incomplete — the 'wait_timer' rule type has `wait_timer` field
 *   that is not typed.
 *   removal path: contribute types to @octokit/types or wait for upstream fix.
 */
const extractWaitTimerFromProtectionRules = (input: {
  protectionRules: GithubEnvironmentResponse['protection_rules'];
}): number | null => {
  const waitRule = input.protectionRules?.find(
    (rule) => rule.type === 'wait_timer',
  );
  if (!waitRule) return null;
  // note: cast required — @octokit/types lacks wait_timer field on rule
  return (waitRule as any).wait_timer ?? null;
};

/**
 * .what = extracts prevent_self_review flag from protection rules
 * .why = decodes the required_reviewers rule to a boolean flag
 *
 * .note = `as any` cast required because @octokit/types protection_rules
 *   type is incomplete — the 'required_reviewers' rule type has
 *   `prevent_self_review` field that is not typed.
 *   removal path: contribute types to @octokit/types or wait for upstream fix.
 */
const extractPreventSelfReviewFromProtectionRules = (input: {
  protectionRules: GithubEnvironmentResponse['protection_rules'];
}): boolean => {
  const reviewRule = input.protectionRules?.find(
    (rule) => rule.type === 'required_reviewers',
  );
  if (!reviewRule) return false;
  // note: cast required — @octokit/types lacks prevent_self_review field on rule
  return (reviewRule as any).prevent_self_review ?? false;
};

/**
 * .what = extracts typed custom patterns from branch policies array
 * .why = transforms API shape (wire `type`) to our domain `{ name, target }` rows
 * .note = a policy row without a `type` defaults to 'branch' (GitHub's historical default)
 * .note = fails loud on a nameless row rather than drop it silently: a policy row
 *         with no name is anomalous data that would otherwise become an orphan the
 *         cast never surfaces as drift
 */
const extractCustomPatternsFromBranchPolicies = (input: {
  branchPolicies: GithubBranchPoliciesResponse;
}): Array<{ name: string; target: DeploymentPolicyTarget }> => {
  return input.branchPolicies.branch_policies.map((bp) => ({
    name:
      bp.name ??
      MalfunctionError.throw(
        'deployment branch policy row has no name; anomalous GitHub state',
        { row: bp },
      ),
    target: asDeploymentPolicyTarget({ row: bp }),
  }));
};

/**
 * .what = extracts deployment branch policy configuration
 * .why = transforms API shape to our domain union type
 */
const extractDeploymentBranchPolicy = (input: {
  policy: GithubEnvironmentResponse['deployment_branch_policy'];
  branchPolicies: GithubBranchPoliciesResponse | null;
}): DeclaredGithubEnvironment['deploymentBranchPolicy'] => {
  if (!input.policy) return null;

  if (input.policy.protected_branches) {
    return { protectedBranches: true as const };
  }

  if (input.policy.custom_branch_policies && input.branchPolicies) {
    const customPatterns = extractCustomPatternsFromBranchPolicies({
      branchPolicies: input.branchPolicies,
    });
    // fail loud on flag-on-zero-rows: `custom_branch_policies: true` with no rows
    // is an allowlist that admits no ref. null would misreport it as "all refs"
    // (the exact opposite), so surface the anomalous state rather than invert it
    if (customPatterns.length === 0)
      MalfunctionError.throw(
        'custom_branch_policies is true but zero policy rows exist; anomalous GitHub state',
        { policy: input.policy },
      );
    return { customPatterns };
  }

  return null;
};

/**
 * .what = casts GitHub API environment response to DeclaredGithubEnvironment
 * .why = transforms external API shape to our domain model
 * .note = reviewers are extracted as usernames (not IDs) for ergonomics
 */
export const castToDeclaredGithubEnvironment = (input: {
  data: GithubEnvironmentResponse;
  branchPolicies: GithubBranchPoliciesResponse | null;
  repo: RefByUnique<typeof DeclaredGithubRepo>;
}): HasMetadata<DeclaredGithubEnvironment> => {
  // extract fields via named transformers
  const reviewers = extractReviewersFromProtectionRules({
    protectionRules: input.data.protection_rules,
  });
  const waitTimer = extractWaitTimerFromProtectionRules({
    protectionRules: input.data.protection_rules,
  });
  const preventSelfReview = extractPreventSelfReviewFromProtectionRules({
    protectionRules: input.data.protection_rules,
  });
  const deploymentBranchPolicy = extractDeploymentBranchPolicy({
    policy: input.data.deployment_branch_policy,
    branchPolicies: input.branchPolicies,
  });

  return DeclaredGithubEnvironment.as({
    id: input.data.id,
    repo: input.repo,
    name: input.data.name,
    reviewers,
    waitTimer,
    deploymentBranchPolicy,
    preventSelfReview,
  }) as HasMetadata<DeclaredGithubEnvironment>;
};
