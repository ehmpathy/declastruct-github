import type { Endpoints } from '@octokit/types';
import { type RefByUnique, refByUnique } from 'domain-objects';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';
import {
  DeclaredGithubRepoRuleset,
  type DeclaredGithubRepoRulesetBypassActor,
  type DeclaredGithubRepoRulesetConditions,
  type DeclaredGithubRepoRulesetRule,
} from '@src/domain.objects/DeclaredGithubRepoRuleset';

export type GithubRepoRulesetResponse =
  Endpoints['GET /repos/{owner}/{repo}/rulesets/{ruleset_id}']['response']['data'];

/**
 * .what = casts github bypass_actors to the declared shape, sorted to canonical order
 * .why = github may return actors in any order; a stable sort keeps declastruct plan diffs clean
 */
const castToBypassActors = (input: {
  bypassActors: GithubRepoRulesetResponse['bypass_actors'];
}): DeclaredGithubRepoRulesetBypassActor[] => {
  const actors = (input.bypassActors ?? []).map((actor) => ({
    actorId: actor.actor_id ?? null,
    actorType:
      actor.actor_type as DeclaredGithubRepoRulesetBypassActor['actorType'],
    bypassMode:
      (actor.bypass_mode as DeclaredGithubRepoRulesetBypassActor['bypassMode']) ??
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
  rules: GithubRepoRulesetResponse['rules'];
}): DeclaredGithubRepoRulesetRule[] => {
  const rules = (input.rules ?? []).map((rule) => ({
    type: rule.type as DeclaredGithubRepoRulesetRule['type'],
  }));

  // sort by type for a canonical order (copy to avoid in-place mutation)
  return [...rules].sort((a, b) => a.type.localeCompare(b.type));
};

/**
 * .what = casts github ref-name conditions to the declared (flat) shape
 * .why = the repo ruleset only supports ref_name conditions; null when absent
 */
const castToConditions = (input: {
  conditions: GithubRepoRulesetResponse['conditions'];
}): DeclaredGithubRepoRulesetConditions | null => {
  const refName =
    input.conditions && 'ref_name' in input.conditions
      ? input.conditions.ref_name
      : null;
  if (!refName) return null;
  return {
    refNameInclude: refName.include ?? [],
    refNameExclude: refName.exclude ?? [],
  };
};

/**
 * .what = casts a github repo ruleset api response to DeclaredGithubRepoRuleset
 * .why = transforms the external api shape (snake_case) to our domain model (camelCase)
 *        with stable array order so declastruct plan diffs stay clean
 */
export const castToDeclaredGithubRepoRuleset = (input: {
  response: GithubRepoRulesetResponse;
  repo: RefByUnique<typeof DeclaredGithubRepo>;
}): HasMetadata<DeclaredGithubRepoRuleset> => {
  return DeclaredGithubRepoRuleset.as({
    id: input.response.id,
    repo:
      input.repo instanceof DeclaredGithubRepo
        ? refByUnique<typeof DeclaredGithubRepo>(input.repo)
        : input.repo,
    name: input.response.name,
    target: input.response.target as DeclaredGithubRepoRuleset['target'],
    enforcement: input.response.enforcement,
    bypassActors: castToBypassActors({
      bypassActors: input.response.bypass_actors,
    }),
    conditions: castToConditions({ conditions: input.response.conditions }),
    rules: castToRules({ rules: input.response.rules }),
  }) as HasMetadata<DeclaredGithubRepoRuleset>;
};
