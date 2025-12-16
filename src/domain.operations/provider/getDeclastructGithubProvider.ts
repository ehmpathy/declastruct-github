import { DeclastructProvider } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import { DeclaredGithubAppDao } from '@src/access/daos/DeclaredGithubAppDao';
import { DeclaredGithubAppInstallationDao } from '@src/access/daos/DeclaredGithubAppInstallationDao';
import { DeclaredGithubBranchDao } from '@src/access/daos/DeclaredGithubBranchDao';
import { DeclaredGithubBranchProtectionDao } from '@src/access/daos/DeclaredGithubBranchProtectionDao';
import { DeclaredGithubOrgDao } from '@src/access/daos/DeclaredGithubOrgDao';
import { DeclaredGithubOrgMemberPrivilegesDao } from '@src/access/daos/DeclaredGithubOrgMemberPrivilegesDao';
import { DeclaredGithubOrgSecretDao } from '@src/access/daos/DeclaredGithubOrgSecretDao';
import { DeclaredGithubOrgVariableDao } from '@src/access/daos/DeclaredGithubOrgVariableDao';
import { DeclaredGithubRepoConfigDao } from '@src/access/daos/DeclaredGithubRepoConfigDao';
import { DeclaredGithubRepoDao } from '@src/access/daos/DeclaredGithubRepoDao';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclastructGithubProvider } from '@src/domain.objects/DeclastructGithubProvider';

/**
 * .what = creates a declastruct provider for github resources
 * .why = enables github resource management via declastruct framework
 */
export const getDeclastructGithubProvider = (
  input: {
    credentials: {
      token: string;
    };
  },
  context: ContextLogTrail,
): DeclastructGithubProvider => {
  // build context from credentials and log trail
  const providerContext: ContextGithubApi & ContextLogTrail = {
    ...context,
    github: {
      token: input.credentials.token,
    },
  };

  // assemble DAOs for all github resource types
  const daos = {
    DeclaredGithubRepo: DeclaredGithubRepoDao,
    DeclaredGithubBranch: DeclaredGithubBranchDao,
    DeclaredGithubRepoConfig: DeclaredGithubRepoConfigDao,
    DeclaredGithubBranchProtection: DeclaredGithubBranchProtectionDao,
    DeclaredGithubApp: DeclaredGithubAppDao,
    DeclaredGithubAppInstallation: DeclaredGithubAppInstallationDao,
    // Organization resources
    DeclaredGithubOrg: DeclaredGithubOrgDao,
    DeclaredGithubOrgMemberPrivileges: DeclaredGithubOrgMemberPrivilegesDao,
    DeclaredGithubOrgVariable: DeclaredGithubOrgVariableDao,
    DeclaredGithubOrgSecret: DeclaredGithubOrgSecretDao,
  };

  // return provider with all required properties
  return new DeclastructProvider({
    name: 'github',
    daos,
    context: providerContext,
    hooks: {
      beforeAll: async () => {
        // no setup needed for github provider
      },
      afterAll: async () => {
        // no teardown needed for github provider
      },
    },
  });
};
