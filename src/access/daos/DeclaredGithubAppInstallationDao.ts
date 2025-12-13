import { genDeclastructDao } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';
import { getOneAppInstallation } from '../../domain.operations/appInstallation/getOneAppInstallation';
import { setAppInstallation } from '../../domain.operations/appInstallation/setAppInstallation';

/**
 * .what = declastruct DAO for GitHub App installation resources
 * .why = wraps installation operations to conform to declastruct interface with helpful errors
 * .note = delete is null because API deletion requires App JWT; use deleteAppInstallation directly for helpful error with uninstall URL
 */
export const DeclaredGithubAppInstallationDao = genDeclastructDao<
  typeof DeclaredGithubAppInstallation,
  ContextGithubApi & ContextLogTrail
>({
  dobj: DeclaredGithubAppInstallation,
  get: {
    one: {
      byUnique: async (input, context) => {
        return getOneAppInstallation({ by: { unique: input } }, context);
      },
      byPrimary: null,
    },
  },
  set: {
    finsert: async (input, context) => {
      return setAppInstallation({ finsert: input }, context);
    },
    upsert: async (input, context) => {
      return setAppInstallation({ upsert: input }, context);
    },
    delete: null,
  },
});
