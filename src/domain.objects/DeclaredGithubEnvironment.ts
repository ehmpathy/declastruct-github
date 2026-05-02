import { DomainEntity, DomainLiteral, RefByUnique } from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import type { DeclaredGithubRepo } from './DeclaredGithubRepo';

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
   * .what = branch deployment restrictions
   * .note = null = all branches; protectedBranches = protected only; customBranches = specific patterns
   */
  deploymentBranchPolicy:
    | null
    | { protectedBranches: true }
    | { customBranches: string[] };

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
    deploymentBranchPolicy: DomainLiteral,
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

    super(props);
  }
}
