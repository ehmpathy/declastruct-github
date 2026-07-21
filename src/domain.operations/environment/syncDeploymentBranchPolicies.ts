import { MalfunctionError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';

import { asDeploymentPolicyTarget } from './asDeploymentPolicyTarget';
import {
  type DesiredPattern,
  type ExtantPolicy,
  getDeploymentPolicySyncPlan,
} from './getDeploymentPolicySyncPlan';

/**
 * .what = extracts extant policies with their id, name, and target
 * .why = transforms the API rows into the typed shape the pure diff consumes
 * .note = fails loud on a nameless row rather than drop it silently: a policy
 *         row with no name is anomalous data that would otherwise become an
 *         orphan the diff can neither see nor delete
 */
const extractExtantPolicies = (input: {
  branchPolicies: Array<{ id?: number; name?: string | null }>;
}): ExtantPolicy[] => {
  return input.branchPolicies.map((p) => ({
    id: p.id,
    name:
      p.name ??
      MalfunctionError.throw(
        'deployment branch policy row has no name; anomalous GitHub state',
        { row: p },
      ),
    target: asDeploymentPolicyTarget({ row: p }),
  }));
};

/**
 * .what = syncs deployment policies (branch and tag) to match desired state
 * .why = custom patterns require separate API calls for create/delete; each row
 *        carries its own target ('branch' | 'tag'). the delete/create decision is
 *        a pure diff (see getDeploymentPolicySyncPlan); this operation is the i/o
 *        boundary that applies it
 */
export const syncDeploymentBranchPolicies = async (
  input: {
    owner: string;
    repo: string;
    environmentName: string;
    desiredPatterns: DesiredPattern[];
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<void> => {
  const github = getGithubClient({}, context);

  // get extant policies
  const extantResponse = await github.repos.listDeploymentBranchPolicies({
    owner: input.owner,
    repo: input.repo,
    environment_name: input.environmentName,
  });

  const extantPolicies = extractExtantPolicies({
    branchPolicies: extantResponse.data.branch_policies,
  });

  // compute the diff (pure): which rows to delete, which to create
  const { policiesToDelete, patternsToCreate } = getDeploymentPolicySyncPlan({
    extantPolicies,
    desiredPatterns: input.desiredPatterns,
  });

  // delete stale policies
  for (const policy of policiesToDelete) {
    await MalfunctionError.wrap(
      async () =>
        github.repos.deleteDeploymentBranchPolicy({
          owner: input.owner,
          repo: input.repo,
          environment_name: input.environmentName,
          branch_policy_id: policy.id,
        }),
      {
        message: 'github.deleteDeploymentBranchPolicy error',
        metadata: {
          owner: input.owner,
          repo: input.repo,
          environmentName: input.environmentName,
          policy,
        },
      },
    )();
  }

  // create new patterns with their declared target
  for (const pattern of patternsToCreate) {
    await MalfunctionError.wrap(
      async () =>
        github.repos.createDeploymentBranchPolicy({
          owner: input.owner,
          repo: input.repo,
          environment_name: input.environmentName,
          name: pattern.name,
          type: pattern.target,
        }),
      {
        message: 'github.createDeploymentBranchPolicy error',
        metadata: {
          owner: input.owner,
          repo: input.repo,
          environmentName: input.environmentName,
          pattern,
        },
      },
    )();
  }
};
