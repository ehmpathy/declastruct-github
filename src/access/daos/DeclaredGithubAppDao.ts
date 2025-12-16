import { genDeclastructDao } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubApp } from '@src/domain.objects/DeclaredGithubApp';
import { getOneApp } from '@src/domain.operations/app/getOneApp';
import { setApp } from '@src/domain.operations/app/setApp';

/**
 * .what = declastruct DAO for GitHub App resources
 * .why = wraps app operations to conform to declastruct interface with helpful errors
 */
export const DeclaredGithubAppDao = genDeclastructDao<
  typeof DeclaredGithubApp,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubApp,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneApp({ by: { unique: input } }, context);
      },
      byPrimary: null,
    },
  },
  set: {
    finsert: async (input, context) => {
      return setApp({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setApp({ upsert: input }, context);
    },
    delete: null,
  },
});
