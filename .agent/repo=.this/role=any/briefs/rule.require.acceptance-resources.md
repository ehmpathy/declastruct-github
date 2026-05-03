# rule.require.acceptance-resources

## .what

all new declastruct resource types must be added to `resources.acceptance.ts`.

## .why

the acceptance test runs `declastruct plan` + `declastruct apply` on declared resources. this validates the full declarative lifecycle — from domain object to provider to GitHub API — without imperative test code.

resources not in `resources.acceptance.ts` have no acceptance coverage.

## .where

```
src/contract/sdks/.test/assets/resources.acceptance.ts
```

## .pattern

```typescript
export const getResources = async () => {
  const repo = DeclaredGithubRepo.as({ ... });
  const repoConfig = DeclaredGithubRepoConfig.as({ repo, ... });

  // add new resource types here
  const environment = DeclaredGithubEnvironment.as({ repo, ... });

  return [repo, repoConfig, environment];
};
```

## .enforcement

new resource type without acceptance resource declaration = blocker
