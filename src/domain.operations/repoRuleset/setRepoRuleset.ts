import type { Endpoints } from '@octokit/types';
import { asProcedure } from 'as-procedure';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubRepoRuleset } from '@src/domain.objects/DeclaredGithubRepoRuleset';

import { getRepoRuleset } from './getRepoRuleset';

/**
 * .what = the octokit request-body type for ruleset rules
 * .why = octokit types rules as a strict discriminated union per rule type; our domain
 *        models them generically, so we cast to this type at the api boundary
 */
type ApiRulesetRules = NonNullable<
  Endpoints['POST /repos/{owner}/{repo}/rulesets']['parameters']['rules']
>;

/**
 * .what = transforms domain bypass actors to the github api shape
 * .why = the api expects snake_case actor fields
 */
const asApiBypassActors = (input: {
  bypassActors: DeclaredGithubRepoRuleset['bypassActors'];
}) =>
  input.bypassActors.map((actor) => ({
    actor_id: actor.actorId,
    actor_type: actor.actorType,
    bypass_mode: actor.bypassMode,
  }));

/**
 * .what = transforms domain conditions to the github api shape
 * .why = the api expects a ref_name condition object; undefined when absent
 */
const asApiConditions = (input: {
  conditions: DeclaredGithubRepoRuleset['conditions'];
}) => {
  if (!input.conditions) return undefined;
  return {
    ref_name: {
      include: input.conditions.refNameInclude,
      exclude: input.conditions.refNameExclude,
    },
  };
};

/**
 * .what = transforms domain rules to the github api shape
 * .why = the api expects rule objects keyed by type
 * .note = v1 rules carry only the type; rule-type-specific parameters are out of scope
 */
const asApiRules = (input: {
  rules: DeclaredGithubRepoRuleset['rules'];
}): ApiRulesetRules =>
  // cast at the boundary: octokit types rules as a strict per-type union; our domain
  // models them generically, so the shape is structurally compatible but not provably so
  input.rules.map((rule) => ({ type: rule.type })) as ApiRulesetRules;

/**
 * .what = sets a GitHub repository ruleset
 * .why = enables declarative management of repo rulesets (findsert + upsert)
 * .note = mirrors the declastruct get-before-write idiom (see setEnvironment): github is the
 *         single source of truth for these declarative resources, so a get-then-create/update is
 *         the idempotent pattern (not a race); findsert returns the extant ruleset unchanged.
 */
export const setRepoRuleset = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubRepoRuleset;
      upsert: DeclaredGithubRepoRuleset;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubRepoRuleset>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // check if the ruleset exists
    const before = await getRepoRuleset(
      { by: { unique: { repo: desired.repo, name: desired.name } } },
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
        await github.repos.updateRepoRuleset({
          owner: desired.repo.owner,
          repo: desired.repo.name,
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
        await github.repos.createRepoRuleset({
          owner: desired.repo.owner,
          repo: desired.repo.name,
          ...body,
        });

      // read-after-write: confirm actual state
      const after = await getRepoRuleset(
        { by: { unique: { repo: desired.repo, name: desired.name } } },
        context,
      );
      if (!after)
        throw new HelpfulError('repo ruleset not found after set', { desired });
      return after;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error instanceof HelpfulError) throw error;
      if (error instanceof UnexpectedCodePathError) throw error;
      throw new HelpfulError('github.setRepoRuleset error', { cause: error });
    }
  },
);
