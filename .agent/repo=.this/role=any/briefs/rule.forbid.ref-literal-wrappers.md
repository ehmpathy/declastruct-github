# rule.forbid.ref-literal-wrappers

## .what

never create `*RefLiteral` wrapper classes for domain object references.

## .why

`RefByUnique<typeof DomainObject>` already handles nested references correctly. separate `*RefLiteral` classes:

- add redundant indirection
- duplicate type information
- complicate maintenance (two places to update)
- confuse the domain model (is it a Ref or a Literal?)

these wrappers are never useful.

## .pattern

### forbidden

```ts
// DeclaredGithubTeamRefLiteral.ts — redundant wrapper
export class DeclaredGithubTeamRefLiteral extends DomainLiteral<...> {
  org: { login: string };
  slug: string;
}

// usage
class DeclaredGithubTeamMembership extends DomainEntity<...> {
  static nested = {
    team: DeclaredGithubTeamRefLiteral,  // wrong
  };
}
```

### required

```ts
// direct reference via RefByUnique
class DeclaredGithubTeamMembership extends DomainEntity<...> {
  team: RefByUnique<typeof DeclaredGithubTeam>;

  static nested = {
    team: RefByUnique<typeof DeclaredGithubTeam>,  // correct
  };
}
```

## .enforcement

- `*RefLiteral` class declaration = blocker
- import of `*RefLiteral` = blocker
- `static nested` with `*RefLiteral` = blocker
