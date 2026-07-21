# rule.allow.skipif-for-admin-privs

## .what

`when.skipIf` / `then.skipIf` **is allowed** — as a sanctioned, bounded exception to
`rule.forbid.failhide` — for tests that require org-admin (`admin:org`) privileges.

## .why

- CICD auth tokens lack `admin:org` scope **by design** (least-privilege security). see
  `howto.test-admin-resources`.
- admin-priv operations (teams, team membership, org settings) cannot be reproduced in CICD —
  there is no CICD-held credential that grants them.
- a hard failure (`ConstraintError.throw`) would redden CICD on **every** run, since the admin
  scope is never present there. that is noise, not signal.
- `skipIf(!hasOrgAdmin)` keeps the test dormant in CICD but **runnable by an admin locally**
  (`TEST_ORG_ADMIN=true`). the coverage still exists for whoever holds the key — a better outcome
  than deletion of the test or a permanent red pipeline.

## .scope — admin-priv operations only

allowed **only** for operations that genuinely need `admin:org`:

| operation | needs `admin:org`? | skipIf allowed? |
|-----------|--------------------|-----------------|
| teams (create/update) | yes | yes |
| team membership | yes | yes |
| team repo access | yes | yes |
| org settings / org member privileges | yes | yes |
| repos, repo config | no (repo scope) | **no** |
| environments, deployment policies | no (repo scope) | **no** |
| branch protection, rulesets | no (repo scope) | **no** |

CICD auth holds repo `administration`, so repo-scoped tests **must run unconditionally** in CICD.
a skip on a repo-scoped test is a real failhide, not this exception.

## .pattern

```ts
const hasOrgAdmin = process.env.TEST_ORG_ADMIN === 'true';
when.skipIf(!hasOrgAdmin)('[t1] admin-scoped apply', () => {
  // teams, membership, org-level assertions
});
```

## .relation to rule.forbid.failhide

`rule.forbid.failhide` forbids silent skips for an absent resource. this rule carves out **one**
exception: an `admin:org` credential that CICD cannot hold by design. the exception is bounded — it
covers only the admin-priv operations above, never repo-scoped coverage that CICD can and must
exercise.

## .note on bundled plans

when an acceptance plan bundles admin-scoped resources (teams, membership) with repo-scoped ones
(repos, environments), the whole `apply` inherits the admin requirement, because `declastruct apply`
is atomic over the plan. this rule sanctions the `skipIf` on that bundled apply. to also prove the
repo-scoped resources through the CLI in CICD, a future split into a repo-scoped plan (unconditional)
plus an admin-scoped plan (gated) is the paved path — but the gated half stays under this exception.

## .see also

- `howto.test-admin-resources`
- `howto.supply-github-token-for-tests`
- `rule.forbid.failhide` (the rule this bounds an exception to)
