import { MalfunctionError } from 'helpful-errors';

import { asDeploymentPatternKey } from '@src/domain.objects/asDeploymentPatternKey';

import type { DeploymentPolicyTarget } from './asDeploymentPolicyTarget';

/**
 * .what = a desired deployment policy row (name + ref target)
 */
export type DesiredPattern = { name: string; target: DeploymentPolicyTarget };

/**
 * .what = an extant deployment policy row read from the GitHub API
 * .note = id is optional because @octokit/types marks it so; name is required
 *         because extractExtantPolicies fails loud on a nameless row rather than
 *         drop it silently, so a row that reaches this diff always has a name
 */
export type ExtantPolicy = {
  id?: number;
  name: string;
  target: DeploymentPolicyTarget;
};

/**
 * .what = pure diff of desired vs extant deployment policies
 * .why = decouples the sync decision (which rows to delete and create) from the
 *        octokit i/o, so idempotency and target-replace can be unit-tested with
 *        plain fixtures — no GITHUB_TOKEN, no real API. compares on the (name,
 *        target) pair so a target change becomes a delete of the old row plus a
 *        create of the new one (GitHub has no in-place row-type edit)
 */
export const getDeploymentPolicySyncPlan = (input: {
  extantPolicies: ExtantPolicy[];
  desiredPatterns: DesiredPattern[];
}): {
  policiesToDelete: Array<{
    id: number;
    name: string;
    target: DeploymentPolicyTarget;
  }>;
  patternsToCreate: DesiredPattern[];
} => {
  const desiredKeys = new Set(
    input.desiredPatterns.map((p) => asDeploymentPatternKey(p)),
  );
  const extantKeys = new Set(
    input.extantPolicies.map((p) => asDeploymentPatternKey(p)),
  );

  // stale rows: extant whose (name, target) is not desired
  const staleRows = input.extantPolicies.filter(
    (p) => !desiredKeys.has(asDeploymentPatternKey(p)),
  );

  // delete the stale rows
  // note: id is required to call the delete API; a stale row without one is an
  //       orphan the diff can neither target nor clean up, so fail loud rather
  //       than drop it silently (same failhide class as a nameless row)
  const policiesToDelete = staleRows.map((p) => ({
    id:
      typeof p.id === 'number'
        ? p.id
        : MalfunctionError.throw(
            'stale deployment policy row has no id; cannot delete, anomalous GitHub state',
            { row: p },
          ),
    name: p.name,
    target: p.target,
  }));

  // create desired rows whose (name, target) is not extant
  const patternsToCreate = input.desiredPatterns.filter(
    (pattern) => !extantKeys.has(asDeploymentPatternKey(pattern)),
  );

  return { policiesToDelete, patternsToCreate };
};
