import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';
import { delEnvironment } from '@src/domain.operations/environment/delEnvironment';
import { getEnvironment } from '@src/domain.operations/environment/getEnvironment';
import { setEnvironment } from '@src/domain.operations/environment/setEnvironment';

/**
 * .what = declastruct DAO for github environment resources
 * .why = wraps environment operations to conform to declastruct interface
 */
export const DeclaredGithubEnvironmentDao = new DeclastructDao<
  typeof DeclaredGithubEnvironment,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubEnvironment,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getEnvironment({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubEnvironment })(input))
          return getEnvironment({ by: { unique: input } }, context);
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
      return setEnvironment({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setEnvironment({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delEnvironment({ by: { ref: input } }, context);
    },
  },
});
