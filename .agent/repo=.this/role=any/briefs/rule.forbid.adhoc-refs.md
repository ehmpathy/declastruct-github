# rule.forbid.adhoc-refs

## .what

never use primitive types to reference another domain object.

## .why

adhoc references:
- lose type safety (string could be any value)
- break refactor safety (rename field in referenced object, caller still compiles)
- hide domain relationships (reader doesn't know it's a reference)
- prevent `static nested` hydration (domain-objects can't hydrate primitives)

## .pattern

### forbidden

```ts
// DeclaredGithubRepo.ts — adhoc reference
export interface DeclaredGithubRepo {
  owner: string;  // wrong: adhoc ref to DeclaredGithubOrg
  name: string;
}
```

### required

```ts
// DeclaredGithubRepo.ts — explicit reference
export interface DeclaredGithubRepo {
  org: RefByUnique<typeof DeclaredGithubOrg>;  // correct: typed ref
  name: string;
}

export class DeclaredGithubRepo extends DomainEntity<DeclaredGithubRepo> {
  static unique = ['org', 'name'] as const;
  static nested = {
    org: RefByUnique<typeof DeclaredGithubOrg>,
  };
}
```

## .how to detect

look for:
- fields named `*Id`, `*Uuid`, `*Slug` that reference another domain object
- fields like `owner`, `org`, `repo`, `team`, `user` that are primitives
- any field that represents a foreign key relationship

## .enforcement

- primitive field that references domain object = blocker
- absent `static nested` declaration for ref field = blocker
