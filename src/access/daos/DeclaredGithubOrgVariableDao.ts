import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubOrgVariable } from '../../domain.objects/DeclaredGithubOrgVariable';
import { delOrgVariable } from '../../domain.operations/orgVariable/delOrgVariable';
import { getOneOrgVariable } from '../../domain.operations/orgVariable/getOneOrgVariable';
import { setOrgVariable } from '../../domain.operations/orgVariable/setOrgVariable';

/**
 * .what = declastruct DAO for GitHub Organization Variable resources
 * .why = wraps variable operations to conform to declastruct interface
 */
export const DeclaredGithubOrgVariableDao = new DeclastructDao<
  typeof DeclaredGithubOrgVariable,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubOrgVariable,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneOrgVariable({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubOrgVariable })(input))
          return getOneOrgVariable({ by: { unique: input } }, context);
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
      return setOrgVariable({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setOrgVariable({ upsert: input }, context);
    },
    delete: async (input, context) => {
      return delOrgVariable({ variable: input }, context);
    },
  },
});
