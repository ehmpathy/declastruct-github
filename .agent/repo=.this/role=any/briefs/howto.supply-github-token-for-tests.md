# howto.supply-github-token-for-tests

## .what

integration + acceptance tests in this repo call the real github api. they read the
credential from `process.env.GITHUB_TOKEN` (see `src/.test/assets/getSampleGithubContext.ts`).

if that env var is absent, every github test fails fast with:

```
UnexpectedCodePathError: GITHUB_TOKEN env var must be set for tests
```

## .why this happens locally

the `GITHUB_TOKEN` slot is **declared** in the test keyrack manifest
(`.agent/keyrack.yml` → `env.test: [GITHUB_TOKEN]`), but a slot being declared does
**not** mean a value is filled on this machine.

check the fill state:

```sh
rhx keyrack status --owner ehmpath --env test
```

if `GITHUB_TOKEN` is **not** listed there, the slot is empty — there is no value to
source, so the tests cannot authenticate.

> note: this is a robot blocker, not a robot fix. only a human can fill a credential.
> robots must surface this and wait — never fake, skip, or work around the missing token.

## .how a human supplies it (one-time)

local `GITHUB_TOKEN` is minted from a github app, the same way CI does it. the app is
`declastruct-github-test-auth` (the same app CI uses — see `.github/workflows/test.yml`
`DECLASTRUCT_GITHUB_TESTAUTH_APP_*`). its private key lives in 1password at
`keyrack://owner=ehmpath/env=test/DECLASTRUCT_GITHUB_TEST_AUTH_APP`.

> do **not** use `declastruct-github-demo-app` — that is the demo *target*, not the auth
> identity. CI authenticates as `declastruct-github-test-auth`, so local must too. the
> token needs repo `administration` permission on `ehmpathy/declastruct-github-demo`
> (rulesets require repo admin); the test-auth app already grants this.

set it interactively:

```sh
rhx keyrack set --owner ehmpath --env test --key GITHUB_TOKEN --vault os.secure
```

answer the prompts:

```
which mechanism?
└─ 2. EPHEMERAL_VIA_GITHUB_APP — github app installation (short-lived tokens)
choice: 2

which github org?
└─ ehmpathy
choice: <pick ehmpathy>

which github app?
├─ 1. declastruct-github-demo-app (id: 2464749)
├─ 2. declastruct-github-test-auth (id: 2465069)   ← choose this one
├─ 3. declastruct-github-conformer (id: 2471935)
├─ 4. rhelease (id: 2472031)
├─ 5. beaver-by-bhuild (id: 3234162)
└─ 6. seaturtle-by-ehmpathy (id: 4094439)
choice: 2

which github app secret?
└─ private key path (.pem): ~/Downloads/declastruct-github-test-auth.<date>.private-key.pem

✓ roundtrip verified
```

result:

```
🔐 keyrack set (org: ehmpathy, env: test)
   └─ ehmpathy.test.GITHUB_TOKEN
      ├─ mech: EPHEMERAL_VIA_GITHUB_APP
      └─ vault: os.secure
```

then unlock + run as usual:

```sh
eval $(rhx keyrack source --owner ehmpath --env test) && export THOROUGH=true && npm run test:integration
```

verify it is now present:

```sh
rhx keyrack status --owner ehmpath --env test   # GITHUB_TOKEN should now appear
```

## .note on CI

CI does **not** need this manual step. the test workflow mints a fresh token at runtime
from a github app and exports it as `GITHUB_TOKEN` via the keyrack firewall
(`.github/workflows/.test.yml` → `create-github-app-token` + `keyrack firewall ... --into github.actions`).
so tests run hands-free in CI; only **local** runs need a human to fill the token once.

## .what robots should do when blocked

1. confirm the cause via `rhx keyrack status --owner ehmpath --env test`
2. if `GITHUB_TOKEN` is absent, tell the human to fill it (the `rhx keyrack fill` line above)
3. do **not** substitute another token (e.g. a prep `EHMPATHY_SEATURTLE_GITHUB_TOKEN`),
   mock the api, skip, or mark the test as passing — that violates the no-failhide rules
4. proceed with the non-credential work (types/lint/format/unit) which need no token
