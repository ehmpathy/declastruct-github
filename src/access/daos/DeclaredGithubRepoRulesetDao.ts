import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubRepoRuleset } from '@src/domain.objects/DeclaredGithubRepoRuleset';
import { delRepoRuleset } from '@src/domain.operations/repoRuleset/delRepoRuleset';
import { getRepoRuleset } from '@src/domain.operations/repoRuleset/getRepoRuleset';
import { setRepoRuleset } from '@src/domain.operations/repoRuleset/setRepoRuleset';

/**
 * .what = declastruct DAO for github repo ruleset resources
 * .why = wraps repo ruleset operations to conform to declastruct interface
 *
 * .note = byPrimary is undefined: github addresses rulesets by id, but the id alone does
 *   not carry the repo (owner/name) the endpoint needs, so lookup goes through byUnique.
 */
export const DeclaredGithubRepoRulesetDao = new DeclastructDao<
  typeof DeclaredGithubRepoRuleset,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubRepoRuleset,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getRepoRuleset({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubRepoRuleset })(input))
          return getRepoRuleset({ by: { unique: input } }, context);
        UnexpectedCodePathError.throw('unsupported ref type', { input });
      },
    },
    ref: {
      byPrimary: undefined,
      byUnique: undefined,
    },
  },
  set: {
    findsert: async (input, context) => {
      return setRepoRuleset({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setRepoRuleset({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delRepoRuleset({ by: { ref: input } }, context);
    },
  },
});
