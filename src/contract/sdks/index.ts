/**
 * .what = public SDK exports for declastruct-github package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

// domain objects - apps
export { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
export { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';
export type { DeclaredGithubAppPermissions } from '../../domain.objects/DeclaredGithubAppPermissions';
// domain objects - repos
export { DeclaredGithubBranch } from '../../domain.objects/DeclaredGithubBranch';
export { DeclaredGithubBranchProtection } from '../../domain.objects/DeclaredGithubBranchProtection';
export { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';
export { DeclaredGithubRepo } from '../../domain.objects/DeclaredGithubRepo';
export { DeclaredGithubRepoConfig } from '../../domain.objects/DeclaredGithubRepoConfig';

// provider
export type { DeclastructGithubProvider } from '../../domain.objects/DeclastructGithubProvider';
export { getDeclastructGithubProvider } from '../../domain.operations/provider/getDeclastructGithubProvider';
