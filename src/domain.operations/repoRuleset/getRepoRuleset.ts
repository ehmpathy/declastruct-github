import type { Endpoints } from '@octokit/types';
import { asProcedure } from 'as-procedure';
import {
  isRefByUnique,
  type Ref,
  type RefByPrimary,
  type RefByUnique,
} from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';
import { DeclaredGithubRepoRuleset } from '@src/domain.objects/DeclaredGithubRepoRuleset';

import { castToDeclaredGithubRepoRuleset } from './castToDeclaredGithubRepoRuleset';

type GithubRepoRulesetsListResponse =
  Endpoints['GET /repos/{owner}/{repo}/rulesets']['response']['data'];

/**
 * .what = finds the one ruleset in a list whose name fits the target name
 * .why = github has no get-by-name endpoint, so we list then select by name
 * .note = the caller maps 404 -> null per the declastruct get-contract (absent = null), an
 *         allowlisted catch that rethrows all other errors (see getEnvironment)
 * .note = failfast if github returned more than one with the same name (uniqueness unenforced)
 */
const getOneRulesetMatchByName = (input: {
  rulesets: GithubRepoRulesetsListResponse;
  name: string;
}): GithubRepoRulesetsListResponse[number] | null => {
  const matches = input.rulesets.filter(
    (ruleset) => ruleset.name === input.name,
  );
  if (matches.length === 0) return null;
  if (matches.length > 1)
    UnexpectedCodePathError.throw(
      'more than one repo ruleset found for the same name in this repo',
      { name: input.name, count: matches.length },
    );
  return matches[0]!;
};

/**
 * .what = gets a GitHub repository ruleset
 * .why = retrieves current state for declarative management
 *
 * .note = github has no get-by-name endpoint for rulesets. lookup by unique (repo, name)
 *   lists rulesets, finds the one whose name fits, then gets it by id for the full object
 *   (the list endpoint omits rules/conditions/bypass_actors).
 */
export const getRepoRuleset = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubRepoRuleset>;
        primary: RefByPrimary<typeof DeclaredGithubRepoRuleset>;
        ref: Ref<typeof DeclaredGithubRepoRuleset>;
      }>;
    },
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubRepoRuleset> | null> => {
    // handle by.ref dispatch
    if (input.by.ref) {
      if (isRefByUnique({ of: DeclaredGithubRepoRuleset })(input.by.ref)) {
        return getRepoRuleset(
          {
            by: {
              unique: input.by.ref as RefByUnique<
                typeof DeclaredGithubRepoRuleset
              >,
            },
          },
          context,
        );
      }
      return getRepoRuleset(
        {
          by: {
            primary: input.by.ref as RefByPrimary<
              typeof DeclaredGithubRepoRuleset
            >,
          },
        },
        context,
      );
    }

    const github = getGithubClient({}, context);

    // handle by.primary — github addresses rulesets by server-assigned id, but the id
    // alone does not carry the repo ref the endpoint needs; callers must use by.unique
    if (input.by.primary) {
      throw new UnexpectedCodePathError(
        'getRepoRuleset by.primary requires the repo ref, which the primary key does not carry; use by.unique',
        { input },
      );
    }

    // handle by.unique
    if (!input.by.unique) {
      throw new UnexpectedCodePathError('no valid reference provided', {
        input,
      });
    }

    const repo = input.by.unique.repo as RefByUnique<typeof DeclaredGithubRepo>;
    const { name } = input.by.unique;

    try {
      // list rulesets, then select the one whose name fits
      const listResponse = await github.repos.getRepoRulesets({
        owner: repo.owner,
        repo: repo.name,
      });
      const match = getOneRulesetMatchByName({
        rulesets: listResponse.data,
        name,
      });

      // absent = ruleset not found
      if (!match) return null;

      // get the full ruleset by id (the list endpoint omits rules/conditions/bypass_actors)
      const response = await github.repos.getRepoRuleset({
        owner: repo.owner,
        repo: repo.name,
        ruleset_id: match.id,
      });

      return castToDeclaredGithubRepoRuleset({ response: response.data, repo });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error instanceof UnexpectedCodePathError) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getRepoRuleset error', { cause: error });
    }
  },
);
