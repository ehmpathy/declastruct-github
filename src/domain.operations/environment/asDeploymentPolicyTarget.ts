import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the ref target a deployment policy row applies to
 * .why = one named type for the branch-or-tag axis, reused across the cast and the
 *        sync so the union is declared once rather than repeated per call site
 */
export type DeploymentPolicyTarget = 'branch' | 'tag';

/**
 * .what = reads a deployment-policy row's ref target from its wire `type`
 * .why = @octokit/types omits `type` on the branch-policy row, so the value must be
 *        read via cast; a row without a `type` defaults to 'branch' (GitHub's
 *        historical default). centralized here so a future octokit fix or a research
 *        result changes one call site, not two that could silently diverge
 * .note = an absent `type` is the sanctioned historical default (branch); an
 *         unexpected value (neither absent, 'branch', nor 'tag') is anomalous
 *         schema drift and fails loud rather than a false branch report — the
 *         same fail-loud stance applied to nameless, id-less, and zero-row states
 */
export const asDeploymentPolicyTarget = (input: {
  row: object;
}): DeploymentPolicyTarget => {
  const wireType = (input.row as { type?: unknown }).type;

  // absent type: GitHub's historical default is a branch policy
  if (wireType === undefined || wireType === null) return 'branch';

  // known targets map through directly
  if (wireType === 'branch') return 'branch';
  if (wireType === 'tag') return 'tag';

  // any other value is anomalous GitHub state; fail loud rather than assume branch
  return MalfunctionError.throw(
    'deployment policy row has an unexpected wire type; anomalous GitHub state',
    { wireType, row: input.row },
  );
};
