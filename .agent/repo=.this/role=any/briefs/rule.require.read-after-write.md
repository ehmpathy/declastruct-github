# rule.require.read-after-write

## .what

every set/upsert operation must read after write to verify actual state.

## .why

- confirms write persisted
- detects silent failures
- verifies actual state matches expected
- failfast on mismatch

## .pattern

```ts
const upsertInRemote = async (input, context) => {
  // write
  await api.put(input);

  // read: verify actual state via getOne*
  const after = await getOne*({ by: { unique: ... } }, context);

  // failfast if write did not persist
  if (!after)
    UnexpectedCodePathError.throw(
      'read-after-write failed: resource not found after upsert',
      { input },
    );

  // failfast if state does not match expected
  if (after.field !== input.field)
    UnexpectedCodePathError.throw(
      'read-after-write mismatch: field differs from requested',
      { requested: input.field, actual: after.field },
    );

  return after;
};
```

## .verification

1. read via extant `getOne*` operation (reuse, do not duplicate)
2. failfast if resource not found
3. failfast if key fields do not match requested state

## .enforcement

- set/upsert without read-after-write = blocker
- read-after-write without verification = blocker
