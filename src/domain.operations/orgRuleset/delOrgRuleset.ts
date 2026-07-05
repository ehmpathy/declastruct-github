import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref, type RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
import { DeclaredGithubOrgRuleset } from '@src/domain.objects/DeclaredGithubOrgRuleset';

import { getOrgRuleset } from './getOrgRuleset';

/**
 * .what = deletes a GitHub organization ruleset
 * .why = enables declarative management of org rulesets
 * .note = idempotent: no error if the ruleset does not exist
 *
 * github deletes rulesets by server-assigned id, so we look up the id via get-by-unique first.
 * the id lookup goes through @src/access/sdks per the repo's directional-deps layered design.
 */
export const delOrgRuleset = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubOrgRuleset>;
      }>;
    },
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<void> => {
    // must be a unique key ref (org + name) — the only ref that yields an id
    if (
      !input.by.ref ||
      !isRefByUnique({ of: DeclaredGithubOrgRuleset })(input.by.ref)
    )
      throw new UnexpectedCodePathError(
        'delOrgRuleset requires unique key ref (org + name)',
        { input },
      );

    const ref = input.by.ref as RefByUnique<typeof DeclaredGithubOrgRuleset>;
    const org = ref.org as RefByUnique<typeof DeclaredGithubOrg>;

    // look up the ruleset (and its id) by unique key
    const found = await getOrgRuleset({ by: { unique: ref } }, context);

    // idempotent: absent = no-op
    if (!found) return;

    const github = getGithubClient({}, context);

    try {
      await github.repos.deleteOrgRuleset({
        org: org.login,
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
      throw new HelpfulError('github.deleteOrgRuleset error', {
        cause: error,
      });
    }
  },
);
