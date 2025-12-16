import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity, RefByUnique } from 'domain-objects';

import type { DeclaredGithubOrg } from './DeclaredGithubOrg';

/**
 * .what = a declarative structure representing a GitHub Organization secret
 * .why = enables declarative management of org-level GitHub Actions secrets
 *
 * WRITE-ONLY PATTERN:
 * - Secret values are NEVER readable via API
 * - On read: only metadata (name, visibility, created_at) is returned
 * - On write: value must be encrypted with org public key before sending
 * - If value is undefined: existing secret is kept unchanged (shows [KEEP])
 * - If value is provided: secret is created/updated with new encrypted value
 */
export interface DeclaredGithubOrgSecret {
  /**
   * .what = reference to the organization
   */
  org: RefByUnique<typeof DeclaredGithubOrg>;

  /**
   * .what = secret name
   * .note = must be unique per org
   */
  name: string;

  /**
   * .what = secret value (write-only)
   * .note = if undefined, existing secret is kept unchanged
   * .note = value is encrypted before being sent to API
   */
  value?: string;

  /**
   * .what = visibility scope for the secret
   * .note = 'all' = all repos, 'private' = private repos only, 'selected' = specific repos
   */
  visibility: 'all' | 'private' | 'selected';

  /**
   * .what = repository names when visibility is 'selected'
   * .note = only repo names, not full owner/repo format
   */
  selectedRepositoryNames?: string[];

  /**
   * .what = when the secret was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the secret was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;
}

export class DeclaredGithubOrgSecret
  extends DomainEntity<DeclaredGithubOrgSecret>
  implements DeclaredGithubOrgSecret
{
  public static unique = ['org', 'name'] as const;
  public static readonly = ['createdAt', 'updatedAt'] as const;
  public static writeonly = ['value'] as const;
  public static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,
  };
}
