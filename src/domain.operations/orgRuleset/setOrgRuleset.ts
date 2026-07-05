import type { Endpoints } from '@octokit/types';
import { asProcedure } from 'as-procedure';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgRuleset } from '@src/domain.objects/DeclaredGithubOrgRuleset';

import { getOrgRuleset } from './getOrgRuleset';

/**
 * .what = the octokit request-body type for org ruleset rules
 * .why = octokit types rules as a strict discriminated union per rule type; our domain
 *        models them generically, so we cast to this type at the api boundary
 */
type ApiRulesetRules = NonNullable<
  Endpoints['POST /orgs/{org}/rulesets']['parameters']['rules']
>;

/**
 * .what = the octokit request-body type for org ruleset conditions
 * .why = org conditions pair ref_name with repository_name; we cast to this type at the boundary
 */
type ApiRulesetConditions =
  Endpoints['POST /orgs/{org}/rulesets']['parameters']['conditions'];

/**
 * .what = transforms domain bypass actors to the github api shape
 * .why = the api expects snake_case actor fields
 */
const asApiBypassActors = (input: {
  bypassActors: DeclaredGithubOrgRuleset['bypassActors'];
}) =>
  input.bypassActors.map((actor) => ({
    actor_id: actor.actorId,
    actor_type: actor.actorType,
    bypass_mode: actor.bypassMode,
  }));

/**
 * .what = transforms domain conditions to the github org api shape
 * .why = the org api expects a conditions object with ref_name + repository_name; undefined
 *        when absent
 * .note = cast at the boundary: octokit types org conditions as a union of target shapes;
 *         our domain models them as one flat literal, so the shape is structurally compatible
 *         but not provably so
 */
const asApiConditions = (input: {
  conditions: DeclaredGithubOrgRuleset['conditions'];
}): ApiRulesetConditions => {
  if (!input.conditions) return undefined;
  return {
    ref_name: {
      include: input.conditions.refNameInclude,
      exclude: input.conditions.refNameExclude,
    },
    repository_name: {
      include: input.conditions.repositoryNameInclude,
      exclude: input.conditions.repositoryNameExclude,
      protected: input.conditions.repositoryNameProtected,
    },
  } as ApiRulesetConditions;
};

/**
 * .what = transforms domain rules to the github api shape
 * .why = the api expects rule objects keyed by type
 * .note = v1 rules carry only the type; rule-type-specific parameters are out of scope
 */
const asApiRules = (input: {
  rules: DeclaredGithubOrgRuleset['rules'];
}): ApiRulesetRules =>
  // cast at the boundary: octokit types rules as a strict per-type union; our domain
  // models them generically, so the shape is structurally compatible but not provably so
  input.rules.map((rule) => ({ type: rule.type })) as ApiRulesetRules;

/**
 * .what = sets a GitHub organization ruleset
 * .why = enables declarative management of org rulesets (findsert + upsert)
 * .note = mirrors the declastruct get-before-write idiom (see setRepoRuleset): github is the
 *         single source of truth for these declarative resources, so a get-then-create/update is
 *         the idempotent pattern (not a race); findsert returns the extant ruleset unchanged.
 */
export const setOrgRuleset = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubOrgRuleset;
      upsert: DeclaredGithubOrgRuleset;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubOrgRuleset>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // check if the ruleset exists
    const before = await getOrgRuleset(
      { by: { unique: { org: desired.org, name: desired.name } } },
      context,
    );

    // if findsert and found, return as-is
    if (before && input.findsert) return before;

    // build the api request body (shared by create and update)
    const body = {
      name: desired.name,
      target: desired.target,
      enforcement: desired.enforcement,
      bypass_actors: asApiBypassActors({ bypassActors: desired.bypassActors }),
      conditions: asApiConditions({ conditions: desired.conditions }),
      rules: asApiRules({ rules: desired.rules }),
    };

    try {
      // update the extant ruleset, when found
      if (before)
        await github.repos.updateOrgRuleset({
          org: desired.org.login,
          ruleset_id:
            before.id ??
            UnexpectedCodePathError.throw(
              'ruleset found but has no id; cannot update',
              { before },
            ),
          ...body,
        });

      // create a new ruleset, when absent
      if (!before)
        await github.repos.createOrgRuleset({
          org: desired.org.login,
          ...body,
        });

      // read-after-write: confirm actual state
      const after = await getOrgRuleset(
        { by: { unique: { org: desired.org, name: desired.name } } },
        context,
      );
      if (!after)
        throw new HelpfulError('org ruleset not found after set', { desired });
      return after;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error instanceof HelpfulError) throw error;
      if (error instanceof UnexpectedCodePathError) throw error;
      throw new HelpfulError('github.setOrgRuleset error', { cause: error });
    }
  },
);
