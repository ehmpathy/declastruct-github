import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref, type RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';
import { DeclaredGithubRepoRuleset } from '@src/domain.objects/DeclaredGithubRepoRuleset';

import { getRepoRuleset } from './getRepoRuleset';

/**
 * .what = deletes a GitHub repository ruleset
 * .why = enables declarative management of repo rulesets
 * .note = idempotent: no error if the ruleset does not exist
 *
 * github deletes rulesets by server-assigned id, so we look up the id via get-by-unique first.
 * the id lookup goes through @src/access/sdks per the repo's directional-deps layered design.
 */
export const delRepoRuleset = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubRepoRuleset>;
      }>;
    },
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<void> => {
    // must be a unique key ref (repo + name) — the only ref that yields an id
    if (
      !input.by.ref ||
      !isRefByUnique({ of: DeclaredGithubRepoRuleset })(input.by.ref)
    )
      throw new UnexpectedCodePathError(
        'delRepoRuleset requires unique key ref (repo + name)',
        { input },
      );

    const ref = input.by.ref as RefByUnique<typeof DeclaredGithubRepoRuleset>;
    const repo = ref.repo as RefByUnique<typeof DeclaredGithubRepo>;

    // look up the ruleset (and its id) by unique key
    const found = await getRepoRuleset({ by: { unique: ref } }, context);

    // idempotent: absent = no-op
    if (!found) return;

    const github = getGithubClient({}, context);

    try {
      await github.repos.deleteRepoRuleset({
        owner: repo.owner,
        repo: repo.name,
        ruleset_id:
          found.id ??
          UnexpectedCodePathError.throw(
            'ruleset found but has no id; cannot delete',
            { found },
          ),
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error instanceof UnexpectedCodePathError) throw error;
      // idempotent: no error if not found
      if (error.message.includes('Not Found')) return;
      throw new HelpfulError('github.deleteRepoRuleset error', {
        cause: error,
      });
    }
  },
);
