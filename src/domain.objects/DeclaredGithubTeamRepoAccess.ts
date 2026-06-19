import { DomainEntity, type RefByUnique } from 'domain-objects';

import { DeclaredGithubRepo } from './DeclaredGithubRepo';
import { DeclaredGithubTeam } from './DeclaredGithubTeam';

/**
 * .what = a declarative structure which represents team access to a repository
 * .why = enables declarative management of team repo permissions for access control
 */
export interface DeclaredGithubTeamRepoAccess {
  /**
   * .what = reference to the team
   */
  team: RefByUnique<typeof DeclaredGithubTeam>;

  /**
   * .what = reference to the repository
   */
  repo: RefByUnique<typeof DeclaredGithubRepo>;

  /**
   * .what = permission level for the team on this repo
   * .note = 'pull' = read-only
   *         'push' = read + write
   *         'triage' = read + manage issues/PRs
   *         'maintain' = push + manage settings (non-destructive)
   *         'admin' = full control
   */
  permission: 'pull' | 'push' | 'triage' | 'maintain' | 'admin';
}

export class DeclaredGithubTeamRepoAccess
  extends DomainEntity<DeclaredGithubTeamRepoAccess>
  implements DeclaredGithubTeamRepoAccess
{
  public static unique = ['team', 'repo'] as const;
  public static nested = {
    team: DeclaredGithubTeam,
    repo: DeclaredGithubRepo,
  };
}
