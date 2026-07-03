import { DomainEntity, DomainLiteral, RefByUnique } from 'domain-objects';

import type { DeclaredGithubRepo } from './DeclaredGithubRepo';

/**
 * .what = an actor permitted to bypass the rules in a ruleset
 * .why = github rulesets deny-by-rule; a bypass actor is the only allow mechanism
 * .note = actorId is null for DeployKey, and 1 for OrganizationAdmin (per github api)
 */
export interface DeclaredGithubRepoRulesetBypassActor {
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
 * .what = a single rule within a ruleset
 * .why = rules express what the ruleset enforces (e.g. block creation of matched refs)
 * .note = v1 supports parameterless rule types only; rule-type-specific parameters
 *         (e.g. update's update_allows_fetch_and_merge) are out of scope
 */
export interface DeclaredGithubRepoRulesetRule {
  type:
    | 'creation'
    | 'update'
    | 'deletion'
    | 'required_signatures'
    | 'required_linear_history'
    | 'non_fast_forward';
}

/**
 * .what = the conditions that select which refs a ruleset applies to
 * .why = a ruleset only enforces against refs that match these patterns
 * .note = flat include/exclude arrays (github's ref_name.include / ref_name.exclude);
 *         patterns accept globs plus ~ALL and ~DEFAULT_BRANCH
 */
export interface DeclaredGithubRepoRulesetConditions {
  refNameInclude: string[];
  refNameExclude: string[];
}

/**
 * .what = a declarative structure which represents a GitHub repository-level ruleset
 * .why = enables declarative management of repo rulesets (e.g. restrict v* tag creation
 *        to a release app via a bypass actor) per declastruct patterns
 */
export interface DeclaredGithubRepoRuleset {
  /**
   * .what = GitHub's server-assigned ruleset ID
   * .note = is @metadata -> may be undefined; required to address the ruleset for get/update/delete
   */
  id?: number;

  /**
   * .what = reference to the repo this ruleset belongs to
   */
  repo: RefByUnique<typeof DeclaredGithubRepo>;

  /**
   * .what = ruleset name (natural unique key, per repo)
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
  bypassActors: DeclaredGithubRepoRulesetBypassActor[];

  /**
   * .what = which refs the ruleset applies to
   * .note = null when no ref conditions are set
   */
  conditions: DeclaredGithubRepoRulesetConditions | null;

  /**
   * .what = the rules the ruleset enforces
   */
  rules: DeclaredGithubRepoRulesetRule[];
}

export class DeclaredGithubRepoRuleset
  extends DomainEntity<DeclaredGithubRepoRuleset>
  implements DeclaredGithubRepoRuleset
{
  public static primary = ['id'] as const;
  public static unique = ['repo', 'name'] as const;
  // .note = nested value objects (bypassActors/conditions/rules) are DomainLiterals with
  //   flat fields only (primitives + primitive arrays). domain-objects serialize requires
  //   every object-valued field to be a declared DomainObject, and a DomainLiteral is only
  //   safe when its own fields are flat — hence conditions uses refNameInclude/refNameExclude
  //   rather than a nested ref_name object.
  public static nested = {
    repo: RefByUnique<typeof DeclaredGithubRepo>,
    bypassActors: DomainLiteral,
    conditions: DomainLiteral,
    rules: DomainLiteral,
  };
}
