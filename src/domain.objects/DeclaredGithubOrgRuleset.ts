import { DomainEntity, DomainLiteral, RefByUnique } from 'domain-objects';

import type { DeclaredGithubOrg } from './DeclaredGithubOrg';

/**
 * .what = an actor permitted to bypass the rules in an org ruleset
 * .why = github rulesets deny-by-rule; a bypass actor is the only allow mechanism
 * .note = actorId is null for DeployKey, and 1 for OrganizationAdmin (per github api)
 */
export interface DeclaredGithubOrgRulesetBypassActor {
  actorId: number | null;
  actorType:
    | 'Integration'
    | 'OrganizationAdmin'
    | 'RepositoryRole'
    | 'Team'
    | 'DeployKey';
  bypassMode: 'always' | 'pull_request';
}

/**
 * .what = a single rule within an org ruleset
 * .why = rules express what the ruleset enforces (e.g. block creation of matched refs)
 * .note = v1 supports parameterless rule types only; rule-type-specific parameters
 *         (e.g. update's update_allows_fetch_and_merge) are out of scope
 */
export interface DeclaredGithubOrgRulesetRule {
  type:
    | 'creation'
    | 'update'
    | 'deletion'
    | 'required_signatures'
    | 'required_linear_history'
    | 'non_fast_forward';
}

/**
 * .what = the conditions that select which refs and repos an org ruleset applies to
 * .why = an org ruleset enforces only against refs+repos that match these patterns
 * .note = flat include/exclude arrays. refName mirrors github's ref_name.include/exclude
 *         (accepts globs plus ~ALL and ~DEFAULT_BRANCH). repositoryName is the org-only
 *         condition (github's repository_name.include/exclude, accepts globs plus ~ALL);
 *         repositoryNameProtected maps github's repository_name.protected (block target
 *         repo renames). for a branch/tag org ruleset github pairs repository_name with
 *         ref_name, so both live on this flat literal.
 */
export interface DeclaredGithubOrgRulesetConditions {
  refNameInclude: string[];
  refNameExclude: string[];
  repositoryNameInclude: string[];
  repositoryNameExclude: string[];
  repositoryNameProtected: boolean;
}

/**
 * .what = a declarative structure which represents a GitHub organization-level ruleset
 * .why = enables declarative management of org rulesets (e.g. restrict v* tag creation
 *        to a release app across many repos via a bypass actor) per declastruct patterns
 * .note = mirrors DeclaredGithubRepoRuleset one scope up: keyed on org+name, and conditions
 *         add the org-only repositoryName* fields. target is 'branch' | 'tag' for v1
 *         (github org rulesets also support 'push', deferred).
 */
export interface DeclaredGithubOrgRuleset {
  /**
   * .what = GitHub's server-assigned ruleset ID
   * .note = is @metadata -> may be undefined; required to address the ruleset for get/update/delete
   */
  id?: number;

  /**
   * .what = reference to the org this ruleset belongs to
   */
  org: RefByUnique<typeof DeclaredGithubOrg>;

  /**
   * .what = ruleset name (natural unique key, per org)
   * .note = github allows a ruleset rename; a rename out-of-band may create a duplicate
   */
  name: string;

  /**
   * .what = what kind of ref the ruleset targets
   */
  target: 'branch' | 'tag';

  /**
   * .what = whether the ruleset is enforced
   */
  enforcement: 'active' | 'evaluate' | 'disabled';

  /**
   * .what = actors permitted to bypass the rules
   * .note = empty array when no bypass actors; the only allow mechanism for deny rules
   */
  bypassActors: DeclaredGithubOrgRulesetBypassActor[];

  /**
   * .what = which refs and repos the ruleset applies to
   * .note = null when no conditions are set
   */
  conditions: DeclaredGithubOrgRulesetConditions | null;

  /**
   * .what = the rules the ruleset enforces
   */
  rules: DeclaredGithubOrgRulesetRule[];
}

export class DeclaredGithubOrgRuleset
  extends DomainEntity<DeclaredGithubOrgRuleset>
  implements DeclaredGithubOrgRuleset
{
  public static primary = ['id'] as const;
  public static unique = ['org', 'name'] as const;
  // .note = nested value objects (bypassActors/conditions/rules) are DomainLiterals with
  //   flat fields only (primitives + primitive arrays). domain-objects serialize requires
  //   every object-valued field to be a declared DomainObject, and a DomainLiteral is only
  //   safe when its own fields are flat — hence conditions uses refName*/repositoryName*
  //   rather than nested ref_name/repository_name objects.
  public static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,
    bypassActors: DomainLiteral,
    conditions: DomainLiteral,
    rules: DomainLiteral,
  };
}
