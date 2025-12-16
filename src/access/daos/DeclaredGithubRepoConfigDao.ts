import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubRepoConfig } from '@src/domain.objects/DeclaredGithubRepoConfig';
import { getRepoConfig } from '@src/domain.operations/repoConfig/getRepoConfig';
import { setRepoConfig } from '@src/domain.operations/repoConfig/setRepoConfig';

/**
 * .what = declastruct DAO for github repository configuration resources
 * .why = wraps existing repo config operations to conform to declastruct interface
 */
export const DeclaredGithubRepoConfigDao = new DeclastructDao<
  typeof DeclaredGithubRepoConfig,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubRepoConfig,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getRepoConfig({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubRepoConfig })(input))
          return getRepoConfig({ by: { unique: input } }, context);
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
      return setRepoConfig({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setRepoConfig({ upsert: input }, context);
    },
    delete: undefined,
  },
});
