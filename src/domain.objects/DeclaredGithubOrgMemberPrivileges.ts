import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity, RefByUnique } from 'domain-objects';

import type { DeclaredGithubOrg } from './DeclaredGithubOrg';

/**
 * .what = a declarative structure which represents GitHub Organization member privileges
 * .why = enables declarative management of what org members are allowed to do
 * .note = KEY SECURITY RESOURCE - controls what non-owners can do
 */
export interface DeclaredGithubOrgMemberPrivileges {
  /**
   * .what = when the settings were last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;

  /**
   * .what = reference to the organization
   */
  org: RefByUnique<typeof DeclaredGithubOrg>;

  // ============================================
  // REPOSITORY CREATION
  // ============================================

  /**
   * .what = whether non-admin members can create repositories
   */
  membersCanCreateRepositories: boolean;

  /**
   * .what = whether members can create PUBLIC repositories
   * .note = only applies if membersCanCreateRepositories is true
   */
  membersCanCreatePublicRepositories: boolean;

  /**
   * .what = whether members can create PRIVATE repositories
   * .note = only applies if membersCanCreateRepositories is true
   */
  membersCanCreatePrivateRepositories: boolean;

  /**
   * .what = whether members can create INTERNAL repositories
   * .note = only available for enterprise orgs; null if not enterprise
   */
  membersCanCreateInternalRepositories: boolean | null;

  // ============================================
  // REPOSITORY MANAGEMENT (KEY SECURITY SETTINGS)
  // ============================================

  /**
   * .what = whether members with admin permissions can DELETE or TRANSFER repositories
   * .note = KEY SECURITY SETTING - false means only org owners can delete/transfer
   * .note = GitHub default is true (DANGEROUS)
   */
  membersCanDeleteRepositories: boolean;

  /**
   * .what = whether members with admin permissions can change repository VISIBILITY
   * .note = KEY SECURITY SETTING - false means only org owners can change visibility
   * .note = GitHub default is true (DANGEROUS)
   */
  membersCanChangeRepoVisibility: boolean;

  /**
   * .what = whether members can fork private repositories
   */
  membersCanForkPrivateRepositories: boolean;

  // ============================================
  // COLLABORATION
  // ============================================

  /**
   * .what = whether members can invite outside collaborators
   */
  membersCanInviteOutsideCollaborators: boolean;

  // ============================================
  // GITHUB PAGES
  // ============================================

  /**
   * .what = whether members can create GitHub Pages sites
   */
  membersCanCreatePages: boolean;

  /**
   * .what = whether members can create public GitHub Pages sites
   */
  membersCanCreatePublicPages: boolean;

  /**
   * .what = whether members can create private GitHub Pages sites
   */
  membersCanCreatePrivatePages: boolean;

  /**
   * .what = default permission level for new repos
   */
  defaultRepositoryPermission: 'read' | 'write' | 'admin' | 'none';
}

export class DeclaredGithubOrgMemberPrivileges
  extends DomainEntity<DeclaredGithubOrgMemberPrivileges>
  implements DeclaredGithubOrgMemberPrivileges
{
  public static unique = ['org'] as const;
  public static readonly = ['updatedAt'] as const;
  public static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,
  };
}
