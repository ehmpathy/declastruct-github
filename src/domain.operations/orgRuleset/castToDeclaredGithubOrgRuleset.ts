import type { Endpoints } from '@octokit/types';
import { type RefByUnique, refByUnique } from 'domain-objects';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
import {
  DeclaredGithubOrgRuleset,
  type DeclaredGithubOrgRulesetBypassActor,
  type DeclaredGithubOrgRulesetConditions,
  type DeclaredGithubOrgRulesetRule,
} from '@src/domain.objects/DeclaredGithubOrgRuleset';

export type GithubOrgRulesetResponse =
  Endpoints['GET /orgs/{org}/rulesets/{ruleset_id}']['response']['data'];

/**
 * .what = casts github bypass_actors to the declared shape, sorted to canonical order
 * .why = github may return actors in any order; a stable sort keeps declastruct plan diffs clean
 */
const castToBypassActors = (input: {
  bypassActors: GithubOrgRulesetResponse['bypass_actors'];
}): DeclaredGithubOrgRulesetBypassActor[] => {
  const actors = (input.bypassActors ?? []).map((actor) => ({
    actorId: actor.actor_id ?? null,
    actorType:
      actor.actor_type as DeclaredGithubOrgRulesetBypassActor['actorType'],
    bypassMode:
      (actor.bypass_mode as DeclaredGithubOrgRulesetBypassActor['bypassMode']) ??
      'always',
  }));

  // sort by actorType then actorId for a canonical order (copy to avoid in-place mutation)
  return [...actors].sort((a, b) => {
    if (a.actorType !== b.actorType)
      return a.actorType.localeCompare(b.actorType);
    return (a.actorId ?? -1) - (b.actorId ?? -1);
  });
};

/**
 * .what = casts github rules to the declared shape, sorted to canonical order
 * .why = github may return rules in any order; a stable sort keeps declastruct plan diffs clean
 * .note = v1 keeps only the rule type; rule-type-specific parameters are out of scope
 */
const castToRules = (input: {
  rules: GithubOrgRulesetResponse['rules'];
}): DeclaredGithubOrgRulesetRule[] => {
  const rules = (input.rules ?? []).map((rule) => ({
    type: rule.type as DeclaredGithubOrgRulesetRule['type'],
  }));

  // sort by type for a canonical order (copy to avoid in-place mutation)
  return [...rules].sort((a, b) => a.type.localeCompare(b.type));
};

/**
 * .what = casts github org ruleset conditions to the declared (flat) shape
 * .why = the org ruleset supports ref_name + repository_name conditions; null when both absent
 * .note = include/exclude arrays keep github's order (mirrors the repo ruleset cast, which
 *         relies on github to keep the authored order for ref_name include/exclude); a
 *         canonical sort applies only to the object arrays (bypassActors/rules) where github
 *         is known to reorder
 */
const castToConditions = (input: {
  conditions: GithubOrgRulesetResponse['conditions'];
}): DeclaredGithubOrgRulesetConditions | null => {
  const conditions = input.conditions;
  if (!conditions) return null;

  const refName = 'ref_name' in conditions ? conditions.ref_name : undefined;
  const repositoryName =
    'repository_name' in conditions ? conditions.repository_name : undefined;

  // absent = no ref_name and no repository_name conditions
  if (!refName && !repositoryName) return null;

  return {
    refNameInclude: refName?.include ?? [],
    refNameExclude: refName?.exclude ?? [],
    repositoryNameInclude: repositoryName?.include ?? [],
    repositoryNameExclude: repositoryName?.exclude ?? [],
    repositoryNameProtected: repositoryName?.protected ?? false,
  };
};

/**
 * .what = casts a github org ruleset api response to DeclaredGithubOrgRuleset
 * .why = transforms the external api shape (snake_case) to our domain model (camelCase)
 *        with stable array order so declastruct plan diffs stay clean
 */
export const castToDeclaredGithubOrgRuleset = (input: {
  response: GithubOrgRulesetResponse;
  org: RefByUnique<typeof DeclaredGithubOrg>;
}): HasMetadata<DeclaredGithubOrgRuleset> => {
  return DeclaredGithubOrgRuleset.as({
    id: input.response.id,
    org:
      input.org instanceof DeclaredGithubOrg
        ? refByUnique<typeof DeclaredGithubOrg>(input.org)
        : input.org,
    name: input.response.name,
    target: input.response.target as DeclaredGithubOrgRuleset['target'],
    enforcement: input.response.enforcement,
    bypassActors: castToBypassActors({
      bypassActors: input.response.bypass_actors,
    }),
    conditions: castToConditions({ conditions: input.response.conditions }),
    rules: castToRules({ rules: input.response.rules }),
  }) as HasMetadata<DeclaredGithubOrgRuleset>;
};
