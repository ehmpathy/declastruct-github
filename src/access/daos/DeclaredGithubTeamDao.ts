import { DeclastructDao } from 'declastruct';
import { isRefByUnique, type Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';
import { delTeam } from '@src/domain.operations/team/delTeam';
import { getOneTeam } from '@src/domain.operations/team/getOneTeam';
import { setTeam } from '@src/domain.operations/team/setTeam';

/**
 * .what = type guard for DeclaredGithubTeam unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isTeamRefByUnique = isRefByUnique({ of: DeclaredGithubTeam });

/**
 * .what = gets one team by ref, delegates to byUnique
 * .why = avoids inline decode-friction in DAO config
 */
const getOneTeamByRef = async (
  input: Ref<typeof DeclaredGithubTeam>,
  context: ContextGithubApi & VisualogicContext,
) => {
  if (isTeamRefByUnique(input))
    return getOneTeam({ by: { unique: input } }, context);
  UnexpectedCodePathError.throw('unsupported ref type', { input });
};

/**
 * .what = declastruct DAO for GitHub Team resources
 * .why = wraps team operations to conform to declastruct interface
 */
export const DeclaredGithubTeamDao = new DeclastructDao<
  typeof DeclaredGithubTeam,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubTeam,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneTeam({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => getOneTeamByRef(input, context),
    },
    ref: {
      byPrimary: undefined,
      byUnique: undefined,
    },
  },
  set: {
    findsert: async (input, context) => {
      return setTeam({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setTeam({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delTeam({ by: { ref: input } }, context);
    },
  },
});
