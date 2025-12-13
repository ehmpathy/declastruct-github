import { DomainLiteral } from 'domain-objects';

/**
 * .what = a declarative structure representing a GitHub owner (organization or user)
 * .why = provides a reusable type for owner references across GitHub domain objects
 */
export interface DeclaredGithubOwner {
  /**
   * .what = the type of owner
   */
  type: 'organization' | 'user';

  /**
   * .what = the login/slug of the owner
   */
  slug: string;
}

export class DeclaredGithubOwner
  extends DomainLiteral<DeclaredGithubOwner>
  implements DeclaredGithubOwner {}
