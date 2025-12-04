import type { DeclastructDao, DeclastructProvider } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextGithubApi } from './ContextGithubApi';
import type { DeclaredGithubBranch } from './DeclaredGithubBranch';
import type { DeclaredGithubBranchProtection } from './DeclaredGithubBranchProtection';
import type { DeclaredGithubRepo } from './DeclaredGithubRepo';
import type { DeclaredGithubRepoConfig } from './DeclaredGithubRepoConfig';

/**
 * .what = the declastruct provider for github resources
 * .why = provides type safety and reusability for the github provider
 */
export type DeclastructGithubProvider = DeclastructProvider<
  {
    DeclaredGithubRepo: DeclastructDao<
      DeclaredGithubRepo,
      typeof DeclaredGithubRepo,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubBranch: DeclastructDao<
      DeclaredGithubBranch,
      typeof DeclaredGithubBranch,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubRepoConfig: DeclastructDao<
      DeclaredGithubRepoConfig,
      typeof DeclaredGithubRepoConfig,
      ContextGithubApi & ContextLogTrail
    >;
    DeclaredGithubBranchProtection: DeclastructDao<
      DeclaredGithubBranchProtection,
      typeof DeclaredGithubBranchProtection,
      ContextGithubApi & ContextLogTrail
    >;
  },
  ContextGithubApi & ContextLogTrail
>;
