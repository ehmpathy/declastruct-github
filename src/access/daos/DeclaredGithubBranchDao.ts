import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubBranch } from '@src/domain.objects/DeclaredGithubBranch';
import { getBranch } from '@src/domain.operations/branch/getBranch';
import { setBranch } from '@src/domain.operations/branch/setBranch';

/**
 * .what = declastruct DAO for github branch resources
 * .why = wraps existing branch operations to conform to declastruct interface
 * .note = upsert allows updating the branch's commit SHA
 */
export const DeclaredGithubBranchDao = new DeclastructDao<
  typeof DeclaredGithubBranch,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubBranch,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getBranch({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubBranch })(input))
          return getBranch({ by: { unique: input } }, context);
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
      return setBranch({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setBranch({ upsert: input }, context);
    },
    delete: undefined,
  },
});
