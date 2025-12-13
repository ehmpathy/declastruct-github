import { DomainLiteral } from 'domain-objects';

/**
 * .what = permission levels for GitHub App capabilities
 * .why = enables type-safe declaration of granular permissions for GitHub Apps
 */
export type GithubAppPermissionLevel = 'read' | 'write' | 'admin';

/**
 * .what = a declarative structure which represents a GitHub App's permissions
 * .why = enables type-safe permission configuration for GitHub Apps following declastruct patterns
 */
export interface DeclaredGithubAppPermissions {
  // repository permissions
  /**
   * .what = push code and manage file operations
   * .note = null if not set
   */
  contents?: GithubAppPermissionLevel | null;

  /**
   * .what = manage code review processes (pull requests)
   * .note = null if not set
   */
  pullRequests?: GithubAppPermissionLevel | null;

  /**
   * .what = handle issue tracking and labels
   * .note = null if not set
   */
  issues?: GithubAppPermissionLevel | null;

  /**
   * .what = control workflow permissions and artifacts
   * .note = null if not set
   */
  actions?: GithubAppPermissionLevel | null;

  /**
   * .what = set GitHub Actions permissions and manage caches, budgets, and security settings
   * .note = null if not set
   */
  administration?: GithubAppPermissionLevel | null;

  /**
   * .what = basic repository information
   * .note = implicit read access for most operations
   */
  metadata?: 'read' | null;

  /**
   * .what = oversee release management
   * .note = null if not set
   */
  deployments?: GithubAppPermissionLevel | null;

  /**
   * .what = manage status reports (checks)
   * .note = null if not set
   */
  checks?: GithubAppPermissionLevel | null;

  /**
   * .what = review and manage security alerts (code scanning)
   * .note = null if not set
   */
  codeScanning?: GithubAppPermissionLevel | null;

  /**
   * .what = handle repository-specific credentials (secrets)
   * .note = null if not set
   */
  secrets?: GithubAppPermissionLevel | null;

  /**
   * .what = access or edit Actions files in the .github/workflows directory
   * .note = null if not set
   */
  workflows?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository environments
   * .note = null if not set
   */
  environments?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository pages
   * .note = null if not set
   */
  pages?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository packages
   * .note = null if not set
   */
  packages?: GithubAppPermissionLevel | null;

  /**
   * .what = manage repository webhooks
   * .note = null if not set
   */
  repositoryHooks?: GithubAppPermissionLevel | null;

  // organization permissions
  /**
   * .what = org-level administration
   * .note = null if not set
   */
  organizationAdministration?: GithubAppPermissionLevel | null;

  /**
   * .what = manage invitations, memberships, and team assignments
   * .note = null if not set
   */
  members?: GithubAppPermissionLevel | null;

  /**
   * .what = create schemas and manage property values (custom properties)
   * .note = null if not set
   */
  organizationCustomProperties?: GithubAppPermissionLevel | null;

  /**
   * .what = control user blocks
   * .note = null if not set
   */
  organizationUserBlocking?: GithubAppPermissionLevel | null;

  /**
   * .what = configure organization event notifications (webhooks)
   * .note = null if not set
   */
  organizationHooks?: GithubAppPermissionLevel | null;

  /**
   * .what = organization-wide secrets
   * .note = null if not set
   */
  organizationSecrets?: GithubAppPermissionLevel | null;

  /**
   * .what = project management
   * .note = null if not set
   */
  organizationProjects?: GithubAppPermissionLevel | null;

  /**
   * .what = runner infrastructure (self-hosted runners)
   * .note = null if not set
   */
  organizationSelfHostedRunners?: GithubAppPermissionLevel | null;
}

export class DeclaredGithubAppPermissions
  extends DomainLiteral<DeclaredGithubAppPermissions>
  implements DeclaredGithubAppPermissions {}
