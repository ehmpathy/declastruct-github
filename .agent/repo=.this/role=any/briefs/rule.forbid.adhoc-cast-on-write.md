# rule.forbid.adhoc-cast-on-write

## .what

never use `castToDeclared*` directly in set/upsert operations.

## .why

- bypasses read-after-write verification
- assumes write succeeded without confirmation
- trusts input rather than actual state
- violates `rule.require.read-after-write`

## .pattern

### forbidden

```ts
const upsertInRemote = async (input, context) => {
  await api.put(input);

  // adhoc cast: assumes input is now actual state
  return castToDeclaredResource({
    data: undefined,
    ...input,
    field: input.field, // trusts input, not actual
  });
};
```

### required

```ts
const upsertInRemote = async (input, context) => {
  await api.put(input);

  // read via getOne*: confirms actual state
  const after = await getOneResource({ by: { unique: ... } }, context);

  // failfast if not found or mismatch
  if (!after) UnexpectedCodePathError.throw(...);
  if (after.field !== input.field) UnexpectedCodePathError.throw(...);

  return after;
};
```

## .where castToDeclared* is allowed

- in `getOne*` operations (read from API response)
- in test fixtures

## .enforcement

- `castToDeclared*` in set/upsert = blocker
