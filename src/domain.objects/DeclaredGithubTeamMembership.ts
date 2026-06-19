import { DomainEntity, type RefByUnique } from 'domain-objects';

import { DeclaredGithubTeam } from './DeclaredGithubTeam';

/**
 * .what = a declarative structure which represents membership in a GitHub team
 * .why = enables declarative management of team membership for access control
 */
export interface DeclaredGithubTeamMembership {
  /**
   * .what = reference to the team
   */
  team: RefByUnique<typeof DeclaredGithubTeam>;

  /**
   * .what = GitHub username of the member
   */
  username: string;

  /**
   * .what = membership role in the team
   * .note = 'member' = regular member
   *         'maintainer' = can manage team settings and members
   */
  role: 'member' | 'maintainer';
}

export class DeclaredGithubTeamMembership
  extends DomainEntity<DeclaredGithubTeamMembership>
  implements DeclaredGithubTeamMembership
{
  public static unique = ['team', 'username'] as const;
  public static nested = {
    team: DeclaredGithubTeam,
  };
}
