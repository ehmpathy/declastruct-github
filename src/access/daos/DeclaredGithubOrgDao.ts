import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
import { getOneOrg } from '@src/domain.operations/org/getOneOrg';
import { setOrg } from '@src/domain.operations/org/setOrg';

/**
 * .what = declastruct DAO for GitHub Organization resources
 * .why = wraps org operations to conform to declastruct interface
 * .note = orgs cannot be created via API; only existing orgs can be updated
 */
export const DeclaredGithubOrgDao = new DeclastructDao<
  typeof DeclaredGithubOrg,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubOrg,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneOrg({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubOrg })(input))
          return getOneOrg({ by: { unique: input } }, context);
        UnexpectedCodePathError.throw('unsupported ref type', { input });
      },
    },
    ref: {
      byPrimary: undefined,
      byUnique: undefined,
    },
  },
  set: {
    finsert: async (input, context) => {
      return setOrg({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setOrg({ upsert: input }, context);
    },
    delete: undefined, // Cannot delete orgs via this interface
  },
});
