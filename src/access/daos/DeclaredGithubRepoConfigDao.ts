import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubRepoConfig } from '../../domain.objects/DeclaredGithubRepoConfig';
import { getRepoConfig } from '../../domain.operations/repoConfig/getRepoConfig';
import { setRepoConfig } from '../../domain.operations/repoConfig/setRepoConfig';

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
      byPrimary: null,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubRepoConfig })(input))
          return getRepoConfig({ by: { unique: input } }, context);
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
      return setRepoConfig({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setRepoConfig({ upsert: input }, context);
    },
    delete: null,
  },
});
