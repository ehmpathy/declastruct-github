import { DeclastructDao } from 'declastruct';
import { isRefByUnique, type Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeamRepoAccess } from '@src/domain.objects/DeclaredGithubTeamRepoAccess';
import { delTeamRepoAccess } from '@src/domain.operations/teamRepoAccess/delTeamRepoAccess';
import { getOneTeamRepoAccess } from '@src/domain.operations/teamRepoAccess/getOneTeamRepoAccess';
import { setTeamRepoAccess } from '@src/domain.operations/teamRepoAccess/setTeamRepoAccess';

/**
 * .what = type guard for DeclaredGithubTeamRepoAccess unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isAccessRefByUnique = isRefByUnique({
  of: DeclaredGithubTeamRepoAccess,
});

/**
 * .what = gets one team repo access by ref, delegates to byUnique
 * .why = avoids inline decode-friction in DAO config
 */
const getOneTeamRepoAccessByRef = async (
  input: Ref<typeof DeclaredGithubTeamRepoAccess>,
  context: ContextGithubApi & ContextLogTrail,
) => {
  if (isAccessRefByUnique(input))
    return getOneTeamRepoAccess({ by: { unique: input } }, context);
  UnexpectedCodePathError.throw('unsupported ref type', { input });
};

/**
 * .what = declastruct DAO for GitHub Team Repo Access resources
 * .why = wraps team repo access operations to conform to declastruct interface
 */
export const DeclaredGithubTeamRepoAccessDao = new DeclastructDao<
  typeof DeclaredGithubTeamRepoAccess,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubTeamRepoAccess,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneTeamRepoAccess({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) =>
        getOneTeamRepoAccessByRef(input, context),
    },
    ref: {
      byPrimary: undefined,
      byUnique: undefined,
    },
  },
  set: {
    findsert: async (input, context) => {
      return setTeamRepoAccess({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setTeamRepoAccess({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delTeamRepoAccess({ by: { ref: input } }, context);
    },
  },
});
