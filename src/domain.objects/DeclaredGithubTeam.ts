import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity, type RefByUnique } from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import { DeclaredGithubOrg } from './DeclaredGithubOrg';

/**
 * .what = a declarative structure which represents a GitHub team within an organization
 * .why = enables declarative management of GitHub teams for access control
 */
export interface DeclaredGithubTeam {
  /**
   * .what = GitHub's internal team ID
   * .note = is @metadata -> may be undefined
   */
  id?: number;

  /**
   * .what = when the team was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the team was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;

  /**
   * .what = reference to the org this team belongs to
   */
  org: RefByUnique<typeof DeclaredGithubOrg>;

  /**
   * .what = team slug (unique within org)
   * .note = e.g., 'platform-engineers'
   */
  slug: string;

  /**
   * .what = display name of the team
   */
  name: string;

  /**
   * .what = team description
   * .note = null if not set
   */
  description: string | null;

  /**
   * .what = team visibility
   * .note = 'secret' = only visible to org owners and team members
   *         'closed' = visible to all org members
   */
  privacy: 'secret' | 'closed';

  /**
   * .what = whether team discussions are enabled
   */
  notifications: 'enabled' | 'disabled';

  /**
   * .what = parent team for nested hierarchy
   * .note = null if top-level team; secret teams cannot have a parent
   */
  parent: RefByUnique<typeof DeclaredGithubTeam> | null;
}

export class DeclaredGithubTeam
  extends DomainEntity<DeclaredGithubTeam>
  implements DeclaredGithubTeam
{
  public static primary = ['id'] as const;
  public static unique = ['org', 'slug'] as const;
  public static nested = {
    org: DeclaredGithubOrg,
    parent: DeclaredGithubTeam,
  };

  constructor(props: DeclaredGithubTeam) {
    // validate secret teams cannot have a parent
    if (props.privacy === 'secret' && props.parent !== null) {
      throw new BadRequestError('secret teams cannot have a parent', {
        slug: props.slug,
        privacy: props.privacy,
        parent: props.parent,
      });
    }

    super(props);
  }
}
