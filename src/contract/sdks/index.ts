/**
 * .what = public SDK exports for declastruct-github package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

export { DeclaredGithubBranch } from '../../domain.objects/DeclaredGithubBranch';
export { DeclaredGithubBranchProtection } from '../../domain.objects/DeclaredGithubBranchProtection';

// domain objects
export { DeclaredGithubRepo } from '../../domain.objects/DeclaredGithubRepo';
export { DeclaredGithubRepoConfig } from '../../domain.objects/DeclaredGithubRepoConfig';
export type { DeclastructGithubProvider } from '../../domain.objects/DeclastructGithubProvider';
// provider
export { getDeclastructGithubProvider } from '../../domain.operations/provider/getDeclastructGithubProvider';
