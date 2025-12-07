import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubRepo } from '../../domain.objects/DeclaredGithubRepo';
import { getRepo } from '../../domain.operations/repo/getRepo';
import { setRepo } from '../../domain.operations/repo/setRepo';

/**
 * .what = declastruct DAO for github repository resources
 * .why = wraps existing repo operations to conform to declastruct interface
 */
export const DeclaredGithubRepoDao = new DeclastructDao<
  typeof DeclaredGithubRepo,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubRepo,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getRepo({ by: { unique: input } }, context);
      },
      byPrimary: null,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubRepo })(input))
          return getRepo({ by: { unique: input } }, context);
        UnexpectedCodePathError.throw('unsupported ref type', { input });
      },
    },
    ref: {
      byPrimary: null,
      byUnique: null,
    },
  },
  set: {
    finsert: async (input, context) => {
      return setRepo({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setRepo({ upsert: input }, context);
    },
    delete: null,
  },
});
