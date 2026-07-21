import { DomainEntity, DomainLiteral, RefByUnique } from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import { asDeploymentPatternKey } from './asDeploymentPatternKey';
import type { DeclaredGithubRepo } from './DeclaredGithubRepo';

/**
 * .what = a single custom deployment policy pattern (name + ref target)
 * .why = a flat value object (primitives only) so domain-objects can serialize the
 *        customPatterns array — mirrors the ruleset's DeclaredGithubRepoRulesetBypassActor
 */
export interface DeclaredGithubEnvironmentDeploymentPolicyPattern {
  name: string;
  target: 'branch' | 'tag';
}

/**
 * .what = the deployment branch/tag policy for an environment
 * .why = a named DomainLiteral so its nested customPatterns array is declared and
 *        serialize-safe — domain-objects rejects an undeclared object-valued field
 *        (declastruct's plan serialize would fail on a raw customPatterns array)
 * .note = the environment interface keeps the discriminated union for caller ergonomics;
 *         these optional fields express the same variants at runtime, and the environment
 *         constructor enforces non-empty + no-duplicate on customPatterns
 */
export interface DeclaredGithubEnvironmentDeploymentBranchPolicy {
  protectedBranches?: true;
  customPatterns?: DeclaredGithubEnvironmentDeploymentPolicyPattern[];
}
export class DeclaredGithubEnvironmentDeploymentBranchPolicy
  extends DomainLiteral<DeclaredGithubEnvironmentDeploymentBranchPolicy>
  implements DeclaredGithubEnvironmentDeploymentBranchPolicy
{
  // customPatterns items are flat DomainLiterals (primitives only), like the
  // ruleset's bypassActors — this declaration is what makes serialize safe
  public static nested = {
    customPatterns: DomainLiteral,
  };
}

/**
 * .what = a declarative structure which represents a GitHub deployment environment
 * .why = enables declarative management of GitHub environments for OIDC + branch protection
 */
export interface DeclaredGithubEnvironment {
  /**
   * .what = GitHub's internal environment ID
   * .note = is @metadata -> may be undefined
   */
  id?: number;

  /**
   * .what = reference to the repo this environment belongs to
   */
  repo: RefByUnique<typeof DeclaredGithubRepo>;

  /**
   * .what = environment name (e.g., 'production-on-main')
   */
  name: string;

  /**
   * .what = required reviewers — accepts usernames/team slugs, not IDs
   * .note = max 6 total reviewers; null if no reviewers required
   */
  reviewers: {
    users: string[] | null;
    teams: string[] | null;
  } | null;

  /**
   * .what = minutes to wait before deployment
   * .note = must be 0-43200 (30 days max); null if no wait
   */
  waitTimer: number | null;

  /**
   * .what = ref deployment restrictions
   * .note = null = all refs; protectedBranches = protected branches only;
   *         customPatterns = specific name patterns, each scoped to a branch or tag target
   */
  deploymentBranchPolicy:
    | null
    | { protectedBranches: true }
    | { customPatterns: DeclaredGithubEnvironmentDeploymentPolicyPattern[] };

  /**
   * .what = whether to prevent actor from self-approval
   */
  preventSelfReview: boolean;
}

export class DeclaredGithubEnvironment
  extends DomainEntity<DeclaredGithubEnvironment>
  implements DeclaredGithubEnvironment
{
  public static primary = ['id'] as const;
  public static unique = ['repo', 'name'] as const;
  public static nested = {
    repo: RefByUnique<typeof DeclaredGithubRepo>,
    reviewers: DomainLiteral,
    deploymentBranchPolicy: DeclaredGithubEnvironmentDeploymentBranchPolicy,
  };

  constructor(props: DeclaredGithubEnvironment) {
    // validate waitTimer range
    if (props.waitTimer !== null) {
      if (props.waitTimer < 0 || props.waitTimer > 43200) {
        throw new BadRequestError(
          `waitTimer must be 0-43200 minutes, got ${props.waitTimer}`,
        );
      }
    }

    // validate reviewers count (max 6 total)
    if (props.reviewers) {
      const userCount = props.reviewers.users?.length ?? 0;
      const teamCount = props.reviewers.teams?.length ?? 0;
      const totalCount = userCount + teamCount;
      if (totalCount > 6) {
        throw new BadRequestError(`max 6 reviewers allowed, got ${totalCount}`);
      }
    }

    // validate customPatterns: reject empty + duplicate (name, target)
    if (
      props.deploymentBranchPolicy &&
      'customPatterns' in props.deploymentBranchPolicy
    ) {
      const patterns = props.deploymentBranchPolicy.customPatterns;

      // reject empty: an empty set is an ambiguous no-op (use null for all refs)
      if (patterns.length === 0) {
        throw new BadRequestError(
          'deploymentBranchPolicy.customPatterns must not be empty; use null to allow all refs',
          { repo: props.repo, name: props.name },
        );
      }

      // reject duplicate (name, target) pairs: they would double-create the same row
      const keys = patterns.map((p) => asDeploymentPatternKey(p));
      const dupKey = keys.find((key, index) => keys.indexOf(key) !== index);
      if (dupKey) {
        throw new BadRequestError(
          `deploymentBranchPolicy.customPatterns has duplicate (name, target): ${dupKey}`,
          { repo: props.repo, name: props.name, patterns },
        );
      }
    }

    super(props);
  }
}
