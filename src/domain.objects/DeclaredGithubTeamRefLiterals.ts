import { DomainLiteral } from 'domain-objects';

/**
 * .what = literal for org reference (flattened for domain-objects compatibility)
 * .why = domain-objects requires explicit nested declarations for manipulation safety
 */
export interface DeclaredGithubOrgRefLiteral {
  login: string;
}
export class DeclaredGithubOrgRefLiteral
  extends DomainLiteral<DeclaredGithubOrgRefLiteral>
  implements DeclaredGithubOrgRefLiteral {}

/**
 * .what = literal for team reference (flattened for domain-objects compatibility)
 * .why = domain-objects requires explicit nested declarations for manipulation safety
 */
export interface DeclaredGithubTeamRefLiteral {
  org: { login: string };
  slug: string;
}
export class DeclaredGithubTeamRefLiteral
  extends DomainLiteral<DeclaredGithubTeamRefLiteral>
  implements DeclaredGithubTeamRefLiteral
{
  public static nested = {
    org: DeclaredGithubOrgRefLiteral,
  };
}
