import type { UniDateTime } from '@ehmpathy/uni-time';
import { DomainEntity } from 'domain-objects';
import { DeclaredGithubAppPermissions } from './DeclaredGithubAppPermissions';
import { DeclaredGithubOwner } from './DeclaredGithubOwner';

/**
 * .what = a declarative structure which represents a GitHub App
 * .why = enables declarative management of GitHub Apps following declastruct patterns
 */
export interface DeclaredGithubApp {
  /**
   * .what = GitHub's internal app ID
   * .note = is @metadata -> may be undefined
   */
  id?: number;

  /**
   * .what = when the app was created
   * .note = is @metadata -> may be undefined
   */
  createdAt?: UniDateTime;

  /**
   * .what = when the app was last updated
   * .note = is @metadata -> may be undefined
   */
  updatedAt?: UniDateTime;

  /**
   * .what = organization or user that owns the app
   */
  owner: DeclaredGithubOwner;

  /**
   * .what = URL-friendly name of the app
   * .note = used in URLs like github.com/apps/{slug}
   */
  slug: string;

  /**
   * .what = display name of the app
   * .note = null if not set
   */
  name: string | null;

  /**
   * .what = description of what the app does
   * .note = null if not set
   */
  description: string | null;

  /**
   * .what = whether the app is public (anyone can install) or private (only owner can install)
   * .note = defaults to false (private)
   */
  public: boolean;

  /**
   * .what = granular permission mappings for the app
   */
  permissions: DeclaredGithubAppPermissions;

  /**
   * .what = webhook event subscriptions
   * .note = empty array if no events subscribed
   */
  events: string[];

  /**
   * .what = external homepage URL
   */
  homepageUrl: string;

  /**
   * .what = webhook URL for receiving events
   * .note = null if not set
   */
  webhookUrl: string | null;
}

export class DeclaredGithubApp
  extends DomainEntity<DeclaredGithubApp>
  implements DeclaredGithubApp
{
  public static primary = ['id'] as const;
  public static unique = ['owner', 'slug'] as const;
  public static nested = {
    owner: DeclaredGithubOwner,
    permissions: DeclaredGithubAppPermissions,
  };
}
