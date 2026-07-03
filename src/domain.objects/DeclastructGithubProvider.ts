import type { DeclastructDao, DeclastructProvider } from 'declastruct';
import type { ContextLogTrail } from 'sdk-logs';

import type { ContextGithubApi } from './ContextGithubApi';
import type { DeclaredGithubApp } from './DeclaredGithubApp';
import type { DeclaredGithubAppInstallation } from './DeclaredGithubAppInstallation';
import type { DeclaredGithubBranch } from './DeclaredGithubBranch';
import type { DeclaredGithubBranchProtection } from './DeclaredGithubBranchProtection';
import type { DeclaredGithubEnvironment } from './DeclaredGithubEnvironment';
import type { DeclaredGithubOrg } from './DeclaredGithubOrg';
import type { DeclaredGithubOrgMemberPrivileges } from './DeclaredGithubOrgMemberPrivileges';
import type { DeclaredGithubOrgSecret } from './DeclaredGithubOrgSecret';
import type { DeclaredGithubOrgVariable } from './DeclaredGithubOrgVariable';
import type { DeclaredGithubRepo } from './DeclaredGithubRepo';
import type { DeclaredGithubRepoConfig } from './DeclaredGithubRepoConfig';
import type { DeclaredGithubRepoRuleset } from './DeclaredGithubRepoRuleset';
import type { DeclaredGithubTeam } from './DeclaredGithubTeam';
import type { DeclaredGithubTeamMembership } from './DeclaredGithubTeamMembership';
import type { DeclaredGithubTeamRepoAccess } from './DeclaredGithubTeamRepoAccess';

/**
 * .what = the declastruct provider for github resources
 * .why = provides type safety and reusability for the github provider
 */
export type DeclastructGithubProvider = DeclastructProvider<
  {
    DeclaredGithubRepo: DeclastructDao<
      typeof DeclaredGithubRepo,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubBranch: DeclastructDao<
      typeof DeclaredGithubBranch,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubRepoConfig: DeclastructDao<
      typeof DeclaredGithubRepoConfig,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubBranchProtection: DeclastructDao<
      typeof DeclaredGithubBranchProtection,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubEnvironment: DeclastructDao<
      typeof DeclaredGithubEnvironment,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubRepoRuleset: DeclastructDao<
      typeof DeclaredGithubRepoRuleset,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubApp: DeclastructDao<
      typeof DeclaredGithubApp,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubAppInstallation: DeclastructDao<
      typeof DeclaredGithubAppInstallation,
      ContextGithubApi & ContextLogTrail
    >;

    // Organization resources
    DeclaredGithubOrg: DeclastructDao<
      typeof DeclaredGithubOrg,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubOrgMemberPrivileges: DeclastructDao<
      typeof DeclaredGithubOrgMemberPrivileges,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubOrgVariable: DeclastructDao<
      typeof DeclaredGithubOrgVariable,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubOrgSecret: DeclastructDao<
      typeof DeclaredGithubOrgSecret,
      ContextGithubApi & ContextLogTrail
    >;

    // Team resources
    DeclaredGithubTeam: DeclastructDao<
      typeof DeclaredGithubTeam,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubTeamMembership: DeclastructDao<
      typeof DeclaredGithubTeamMembership,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubTeamRepoAccess: DeclastructDao<
      typeof DeclaredGithubTeamRepoAccess,
      ContextGithubApi & ContextLogTrail
    >;
  },
  ContextGithubApi & ContextLogTrail
>;
