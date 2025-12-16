import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';
import { delOrgSecret } from '@src/domain.operations/orgSecret/delOrgSecret';
import { getOneOrgSecret } from '@src/domain.operations/orgSecret/getOneOrgSecret';
import { setOrgSecret } from '@src/domain.operations/orgSecret/setOrgSecret';

/**
 * .what = declastruct DAO for GitHub Organization Secret resources
 * .why = wraps secret operations to conform to declastruct interface
 * .note = secrets are write-only; values are never readable
 */
export const DeclaredGithubOrgSecretDao = new DeclastructDao<
  typeof DeclaredGithubOrgSecret,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubOrgSecret,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneOrgSecret({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubOrgSecret })(input))
          return getOneOrgSecret({ by: { unique: input } }, context);
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
      return setOrgSecret({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setOrgSecret({ upsert: input }, context);
    },
    delete: async (input, context) => {
      return delOrgSecret({ secret: input }, context);
    },
  },
});
