/**
 * .what = public SDK exports for declastruct-github package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

// domain objects - apps
export { DeclaredGithubApp } from '@src/domain.objects/DeclaredGithubApp';
export { DeclaredGithubAppInstallation } from '@src/domain.objects/DeclaredGithubAppInstallation';
export type { DeclaredGithubAppPermissions } from '@src/domain.objects/DeclaredGithubAppPermissions';
// domain objects - repos
export { DeclaredGithubBranch } from '@src/domain.objects/DeclaredGithubBranch';
export { DeclaredGithubBranchProtection } from '@src/domain.objects/DeclaredGithubBranchProtection';
// domain objects - orgs
export { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
export { DeclaredGithubOrgMemberPrivileges } from '@src/domain.objects/DeclaredGithubOrgMemberPrivileges';
export { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';
export { DeclaredGithubOrgVariable } from '@src/domain.objects/DeclaredGithubOrgVariable';
export { DeclaredGithubOwner } from '@src/domain.objects/DeclaredGithubOwner';
export { DeclaredGithubRepo } from '@src/domain.objects/DeclaredGithubRepo';
export { DeclaredGithubRepoConfig } from '@src/domain.objects/DeclaredGithubRepoConfig';
// provider
export type { DeclastructGithubProvider } from '@src/domain.objects/DeclastructGithubProvider';
export { getDeclastructGithubProvider } from '@src/domain.operations/provider/getDeclastructGithubProvider';
