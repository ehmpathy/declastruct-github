# rule.require.typed-refs

## .what

all domain object references must use `RefByUnique<typeof T>` or `RefByPrimary<typeof T>`.

## .why

typed references:
- enable type safety (compiler validates reference shape)
- enable refactor safety (rename field in referenced object, callers break at compile time)
- express domain relationships (reader sees explicit reference)
- enable `static nested` hydration (domain-objects can hydrate typed refs)

## .pattern

### required: RefByUnique for natural keys

```ts
// DeclaredGithubTeamRepoAccess.ts
export interface DeclaredGithubTeamRepoAccess {
  team: RefByUnique<typeof DeclaredGithubTeam>;  // correct: unique key ref
  repo: RefByUnique<typeof DeclaredGithubRepo>;  // correct: unique key ref
  permission: 'pull' | 'push' | 'admin';
}

export class DeclaredGithubTeamRepoAccess extends DomainEntity<DeclaredGithubTeamRepoAccess> {
  static unique = ['team', 'repo'] as const;
  static nested = {
    team: RefByUnique<typeof DeclaredGithubTeam>,
    repo: RefByUnique<typeof DeclaredGithubRepo>,
  };
}
```

### required: RefByPrimary for artificial keys

```ts
// when ref is by database-generated id
export interface InvoiceLineItem {
  invoice: RefByPrimary<typeof Invoice>;  // correct: primary key ref
  amount: number;
}

export class InvoiceLineItem extends DomainEntity<InvoiceLineItem> {
  static nested = {
    invoice: RefByPrimary<typeof Invoice>,
  };
}
```

### required: static nested declaration

every ref field must be declared in `static nested` for hydration:

```ts
export class DeclaredGithubTeam extends DomainEntity<DeclaredGithubTeam> {
  org: RefByUnique<typeof DeclaredGithubOrg>;
  slug: string;

  static unique = ['org', 'slug'] as const;
  static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,  // required: enables hydration
  };
}
```

## .when to use which

| scenario | ref type |
|----------|----------|
| reference by natural/unique key | `RefByUnique<typeof T>` |
| reference by primary/artificial key | `RefByPrimary<typeof T>` |
| either is acceptable | `Ref<typeof T>` (union) |

## .enforcement

- ref field without `RefByUnique` or `RefByPrimary` = blocker
- ref field not declared in `static nested` = blocker
