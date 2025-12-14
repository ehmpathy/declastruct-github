import { DomainLiteral } from 'domain-objects';

/**
 * .what = permission levels for GitHub App capabilities
 * .why = enables type-safe declaration of granular permissions for GitHub Apps
 */
export type GithubAppPermissionLevel = 'read' | 'write' | 'admin';

/**
 * .what = repository-level permissions for GitHub Apps
 * .why = scopes permissions explicitly to repository resources
 */
export interface DeclaredGithubAppRepositoryPermissions {
  /**
   * .what = push code and manage file operations
   */
  contents?: GithubAppPermissionLevel | null;

  /**
   * .what = manage code review processes (pull requests)
   */
  pullRequests?: GithubAppPermissionLevel | null;

  /**
   * .what = handle issue tracking and labels
   */
  issues?: GithubAppPermissionLevel | null;

  /**
   * .what = control workflow permissions and artifacts
   */
  actions?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repo settings, branch protection, and security settings
   * .note = nuclear option! can delete/rename/transfer repos unless org restricts this to owners
   */
  administration?: GithubAppPermissionLevel | null;

  /**
   * .what = basic repository information
   * .note = implicit read access for most operations
   */
  metadata?: 'read' | null;

  /**
   * .what = oversee release management
   */
  deployments?: GithubAppPermissionLevel | null;

  /**
   * .what = manage status reports (checks)
   */
  checks?: GithubAppPermissionLevel | null;

  /**
   * .what = review and manage security alerts (code scanning)
   */
  codeScanning?: GithubAppPermissionLevel | null;

  /**
   * .what = handle repository-specific credentials (secrets)
   */
  secrets?: GithubAppPermissionLevel | null;

  /**
   * .what = access or edit Actions files in the .github/workflows directory
   */
  workflows?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository environments
   */
  environments?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository pages
   */
  pages?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository packages
   */
  packages?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository webhooks
   */
  hooks?: GithubAppPermissionLevel | null;
}

/**
 * .what = organization-level permissions for GitHub Apps
 * .why = scopes permissions explicitly to organization resources
 */
export interface DeclaredGithubAppOrganizationPermissions {
  /**
   * .what = org-level administration
   */
  administration?: GithubAppPermissionLevel | null;

  /**
   * .what = manage invitations, memberships, and team assignments
   */
  members?: GithubAppPermissionLevel | null;

  /**
   * .what = create schemas and manage property values (custom properties)
   */
  customProperties?: GithubAppPermissionLevel | null;

  /**
   * .what = control user blocks
   */
  userBlocking?: GithubAppPermissionLevel | null;

  /**
   * .what = configure organization event notifications (webhooks)
   */
  hooks?: GithubAppPermissionLevel | null;

  /**
   * .what = organization-wide secrets
   */
  secrets?: GithubAppPermissionLevel | null;

  /**
   * .what = project management
   */
  projects?: GithubAppPermissionLevel | null;

  /**
   * .what = runner infrastructure (self-hosted runners)
   */
  selfHostedRunners?: GithubAppPermissionLevel | null;
}

/**
 * .what = a declarative structure which represents a GitHub App's permissions
 * .why = enables type-safe permission configuration for GitHub Apps following declastruct patterns
 */
export interface DeclaredGithubAppPermissions {
  repository: DeclaredGithubAppRepositoryPermissions | null;
  organization: DeclaredGithubAppOrganizationPermissions | null;
}

export class DeclaredGithubAppPermissions
  extends DomainLiteral<DeclaredGithubAppPermissions>
  implements DeclaredGithubAppPermissions
{
  public static nested = {
    repository: DomainLiteral,
    organization: DomainLiteral,
  };
}
