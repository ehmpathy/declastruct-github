import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity } from 'domain-objects';

/**
 * .what = a declarative structure which represents GitHub Organization profile
 * .why = enables declarative management of org profile settings
 */
export interface DeclaredGithubOrg {
  /**
   * .what = GitHub's internal org ID
   * .note = is @metadata -> may be undefined
   */
  id?: number;

  /**
   * .what = when the org was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the org was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;

  /**
   * .what = organization login/handle
   * .note = e.g., 'ehmpathy'
   */
  login: string;

  /**
   * .what = display name of the organization (shown on profile)
   * .note = null if not set (falls back to login in UI)
   */
  name: string | null;

  /**
   * .what = organization description
   * .note = null if not set
   */
  description: string | null;

  /**
   * .what = billing email address (write-only)
   * .note = if undefined, existing value is kept unchanged
   */
  billingEmail?: string;

  // ============================================
  // READ-ONLY METADATA
  // ============================================

  /**
   * .what = whether 2FA is required for all members
   * .note = is @metadata -> read-only
   */
  twoFactorRequirementEnabled?: boolean;

  /**
   * .what = count of public repos
   * .note = is @metadata -> read-only
   */
  publicRepos?: number;
}

export class DeclaredGithubOrg
  extends DomainEntity<DeclaredGithubOrg>
  implements DeclaredGithubOrg
{
  public static primary = ['id'] as const;
  public static unique = ['login'] as const;
  public static readonly = [
    'twoFactorRequirementEnabled',
    'publicRepos',
  ] as const;
  public static writeonly = ['billingEmail'] as const;
}
