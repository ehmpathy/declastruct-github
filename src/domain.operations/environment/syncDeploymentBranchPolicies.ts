import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

type BranchPolicy = { id?: number; name?: string | null };

/**
 * .what = extracts non-null pattern names from branch policies
 * .why = transforms API shape to a set of names for comparison
 */
const extractPatternNamesAsSet = (input: {
  branchPolicies: Array<{ name?: string | null }>;
}): Set<string> => {
  const names = input.branchPolicies
    .map((p) => p.name)
    .filter((name): name is string => !!name);
  return new Set(names);
};

/**
 * .what = computes which extant patterns should be deleted
 * .why = extracts deletion decision logic from sync orchestration
 */
const computeStalePatternsToDelete = (input: {
  extantPatterns: BranchPolicy[];
  desiredNames: Set<string>;
}): Array<{ id: number; name: string }> => {
  return input.extantPatterns
    .filter(
      (p): p is { id: number; name: string } =>
        typeof p.id === 'number' &&
        typeof p.name === 'string' &&
        !input.desiredNames.has(p.name),
    )
    .map((p) => ({ id: p.id, name: p.name }));
};

/**
 * .what = computes which patterns need to be created
 * .why = extracts creation decision logic from sync orchestration
 */
const computeNewPatternsToCreate = (input: {
  desiredPatterns: string[];
  extantNames: Set<string>;
}): string[] => {
  return input.desiredPatterns.filter(
    (pattern) => !input.extantNames.has(pattern),
  );
};

/**
 * .what = syncs deployment branch policies to match desired state
 * .why = custom branch patterns require separate API calls for create/delete
 */
export const syncDeploymentBranchPolicies = async (
  input: {
    owner: string;
    repo: string;
    environmentName: string;
    desiredPatterns: string[];
  },
  context: ContextGithubApi & VisualogicContext,
): Promise<void> => {
  const github = getGithubClient({}, context);

  // get extant patterns
  const extantResponse = await github.repos.listDeploymentBranchPolicies({
    owner: input.owner,
    repo: input.repo,
    environment_name: input.environmentName,
  });

  const extantPatterns = extantResponse.data.branch_policies;
  const extantNames = extractPatternNamesAsSet({
    branchPolicies: extantPatterns,
  });
  const desiredNames = new Set(input.desiredPatterns);

  // compute patterns to delete
  const patternsToDelete = computeStalePatternsToDelete({
    extantPatterns,
    desiredNames,
  });

  // compute patterns to create
  const patternsToCreate = computeNewPatternsToCreate({
    desiredPatterns: input.desiredPatterns,
    extantNames,
  });

  // delete stale patterns
  for (const pattern of patternsToDelete) {
    await github.repos.deleteDeploymentBranchPolicy({
      owner: input.owner,
      repo: input.repo,
      environment_name: input.environmentName,
      branch_policy_id: pattern.id,
    });
  }

  // create new patterns
  for (const pattern of patternsToCreate) {
    await github.repos.createDeploymentBranchPolicy({
      owner: input.owner,
      repo: input.repo,
      environment_name: input.environmentName,
      name: pattern,
      type: 'branch',
    });
  }
};
