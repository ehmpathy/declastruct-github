import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity, RefByUnique } from 'domain-objects';

import type { DeclaredGithubOrg } from './DeclaredGithubOrg';

/**
 * .what = a declarative structure representing a GitHub Organization variable
 * .why = enables declarative management of org-level GitHub Actions variables
 */
export interface DeclaredGithubOrgVariable {
  /**
   * .what = reference to the organization
   */
  org: RefByUnique<typeof DeclaredGithubOrg>;

  /**
   * .what = variable name
   * .note = must be unique per org
   */
  name: string;

  /**
   * .what = variable value
   * .note = stored in plain text (not encrypted)
   */
  value: string;

  /**
   * .what = visibility scope for the variable
   * .note = 'all' = all repos, 'private' = private repos only, 'selected' = specific repos
   */
  visibility: 'all' | 'private' | 'selected';

  /**
   * .what = repository names when visibility is 'selected'
   * .note = only repo names, not full owner/repo format
   */
  selectedRepositoryNames?: string[];

  /**
   * .what = when the variable was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the variable was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;
}

export class DeclaredGithubOrgVariable
  extends DomainEntity<DeclaredGithubOrgVariable>
  implements DeclaredGithubOrgVariable
{
  public static unique = ['org', 'name'] as const;
  public static readonly = ['createdAt', 'updatedAt'] as const;
  public static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,
  };
}
