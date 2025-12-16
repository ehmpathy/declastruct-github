import { DeclastructDao } from 'declastruct';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubOrgMemberPrivileges } from '../../domain.objects/DeclaredGithubOrgMemberPrivileges';
import { getOneOrgMemberPrivileges } from '../../domain.operations/orgMemberPrivileges/getOneOrgMemberPrivileges';
import { setOrgMemberPrivileges } from '../../domain.operations/orgMemberPrivileges/setOrgMemberPrivileges';

/**
 * .what = declastruct DAO for GitHub Organization Member Privileges
 * .why = wraps member privilege operations to conform to declastruct interface
 * .note = KEY SECURITY RESOURCE - controls what non-owners can do
 */
export const DeclaredGithubOrgMemberPrivilegesDao = new DeclastructDao<
  typeof DeclaredGithubOrgMemberPrivileges,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubOrgMemberPrivileges,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneOrgMemberPrivileges({ by: { unique: input } }, context);
      },
      byPrimary: undefined,
      byRef: async (input, context) => {
        if (isRefByUnique({ of: DeclaredGithubOrgMemberPrivileges })(input))
          return getOneOrgMemberPrivileges({ by: { unique: input } }, context);
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
      return setOrgMemberPrivileges({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setOrgMemberPrivileges({ upsert: input }, context);
    },
    delete: undefined, // Cannot delete member privileges (they always exist for an org)
  },
});
