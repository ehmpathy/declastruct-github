/**
 * .what = stable comparison key for a deployment policy (name, target) pair
 * .why = a branch `v*` and a tag `v*` are distinct rows; one source of truth for
 *        the key so the domain dedup guard and the sync diff cannot diverge on
 *        delimiter or field order
 * .note = lives in domain.objects so both the domain constructor and the
 *         domain.operations sync can import it (directional-deps: operations →
 *         objects is allowed, the reverse is not)
 */
export const asDeploymentPatternKey = (input: {
  name: string;
  target: string;
}): string => `${input.target}:${input.name}`;
