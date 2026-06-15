import { DeclastructDao } from 'declastruct';
import { isRefByUnique, type Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';
import { delTeamMembership } from '@src/domain.operations/teamMembership/delTeamMembership';
import { getOneTeamMembership } from '@src/domain.operations/teamMembership/getOneTeamMembership';
import { setTeamMembership } from '@src/domain.operations/teamMembership/setTeamMembership';

/**
 * .what = type guard for DeclaredGithubTeamMembership unique key ref
 * .why = pre-instantiated to avoid inline decode-friction
 */
const isMembershipRefByUnique = isRefByUnique({
  of: DeclaredGithubTeamMembership,
});

/**
 * .what = gets one team membership by ref, delegates to byUnique
 * .why = avoids inline decode-friction in DAO config
 */
const getOneTeamMembershipByRef = async (
  input: Ref<typeof DeclaredGithubTeamMembership>,
  context: ContextGithubApi & ContextLogTrail,
) => {
  if (isMembershipRefByUnique(input))
    return getOneTeamMembership({ by: { unique: input } }, context);
  UnexpectedCodePathError.throw('unsupported ref type', { input });
};

/**
 * .what = declastruct DAO for GitHub Team Membership resources
 * .why = wraps team membership operations to conform to declastruct interface
 */
export const DeclaredGithubTeamMembershipDao = new DeclastructDao<
  typeof DeclaredGithubTeamMembership,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubTeamMembership,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneTeamMembership({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) =>
        getOneTeamMembershipByRef(input, context),
    },
    ref: {
      byPrimary: undefined,
      byUnique: undefined,
    },
  },
  set: {
    findsert: async (input, context) => {
      return setTeamMembership({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setTeamMembership({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delTeamMembership({ by: { ref: input } }, context);
    },
  },
});
