# howto.test-admin-resources

## .what

some resources require org admin permissions that CI/CD tokens lack.

## .why

- CI/CD tokens have limited scopes for security
- org admin operations (teams, org settings) need elevated permissions
- integration tests for these resources will fail in CI

## .which resources

| resource | scope needed | CI/CD can test? |
|----------|--------------|-----------------|
| repos | repo | yes |
| repo config | repo | yes |
| environments | repo | yes |
| teams | admin:org | no |
| team membership | admin:org | no |
| org settings | admin:org | no |

## .how to test

for resources that need admin:org scope, dogfood via `provision/github`:

1. add resources to `provision/github/resources.ts`
2. run `declastruct plan` locally with admin token
3. run `declastruct apply` to provision
4. verify via GitHub UI or API

this tests the full lifecycle (plan + apply) against a real org.

## .acceptance test strategy

for admin-scoped resources:
- unit tests: verify cast functions, domain object validation
- acceptance tests: plan output snapshots (no apply)
- dogfood: actual provision via provision/github

## .note

the `TEST_ORG_ADMIN=true` flag exists for local development with admin tokens, but CI/CD should not have this permission.
