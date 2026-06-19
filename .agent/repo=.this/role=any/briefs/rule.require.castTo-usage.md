# rule.require.castTo-usage

## .what

always use `castTo$DomainObject` functions to construct domain objects from external data.

## .why

- centralizes transformation logic
- ensures consistent treatment of API response shapes
- enables reuse across GET and SET operations
- makes transformation logic testable in isolation

## .pattern

cast functions must handle both scenarios:
1. GET responses with full data
2. SET responses with partial/empty data (e.g., 204 No Content)

```ts
export const castToDeclaredGithubTeamRepoAccess = (input: {
  data?: GithubTeamRepoResponse;  // optional for PUT 204 responses
  org: string;
  teamSlug: string;
  repoOwner: string;
  repoName: string;
  permission?: DeclaredGithubTeamRepoAccess['permission'];  // fallback when no data
}): HasMetadata<DeclaredGithubTeamRepoAccess> => {
  const permission = input.data?.role_name
    ? asPermission({ roleName: input.data.role_name })
    : input.permission ?? 'pull';
  // ...
};
```

## .enforcement

- direct `DomainObject.as()` in operations (outside cast functions) = blocker
- cast function that cannot handle empty response data = blocker
