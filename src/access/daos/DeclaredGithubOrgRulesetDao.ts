import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubOrgRuleset } from '@src/domain.objects/DeclaredGithubOrgRuleset';
import { delOrgRuleset } from '@src/domain.operations/orgRuleset/delOrgRuleset';
import { getOrgRuleset } from '@src/domain.operations/orgRuleset/getOrgRuleset';
import { setOrgRuleset } from '@src/domain.operations/orgRuleset/setOrgRuleset';

/**
 * .what = declastruct DAO for github org ruleset resources
 * .why = wraps org ruleset operations to conform to declastruct interface
 *
 * .note = byPrimary is undefined: github addresses rulesets by id, but the id alone does
 *   not carry the org (login) the endpoint needs, so lookup goes through byUnique.
 */
export const DeclaredGithubOrgRulesetDao = new DeclastructDao<
  typeof DeclaredGithubOrgRuleset,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubOrgRuleset,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOrgRuleset({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubOrgRuleset })(input))
          return getOrgRuleset({ by: { unique: input } }, context);
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
      return setOrgRuleset({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setOrgRuleset({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delOrgRuleset({ by: { ref: input } }, context);
    },
  },
});
