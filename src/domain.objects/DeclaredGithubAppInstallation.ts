import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity, RefByUnique } from 'domain-objects';

import type { DeclaredGithubApp } from './DeclaredGithubApp';
import { DeclaredGithubOwner } from './DeclaredGithubOwner';

/**
 * .what = a declarative structure which represents a GitHub App installation
 * .why = enables declarative management of GitHub App installations following declastruct patterns
 */
export interface DeclaredGithubAppInstallation {
  /**
   * .what = GitHub's internal installation ID
   * .note = is @metadata -> may be undefined
   */
  id?: number;

  /**
   * .what = when the installation was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the installation was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;

  /**
   * .what = reference to the GitHub App this installation belongs to
   */
  app: RefByUnique<typeof DeclaredGithubApp>;

  /**
   * .what = where this app was installed to
   */
  target: DeclaredGithubOwner;

  /**
   * .what = whether the installation has access to all repos or selected repos
   * .note = defaults to 'all'
   */
  repositorySelection: 'all' | 'selected';

  /**
   * .what = list of repository names the installation has access to
   * .note = only applicable when repositorySelection is 'selected'; null otherwise
   */
  repositories: string[] | null;

  /**
   * .what = whether the installation is suspended
   * .note = is @metadata -> may be undefined
   */
  suspended?: boolean;
}

export class DeclaredGithubAppInstallation
  extends DomainEntity<DeclaredGithubAppInstallation>
  implements DeclaredGithubAppInstallation
{
  public static primary = ['id'] as const;
  public static unique = ['app', 'target'] as const;
  public static readonly = ['suspended'] as const;
  public static nested = {
    app: RefByUnique<typeof DeclaredGithubApp>,
    target: DeclaredGithubOwner,
  };
}
