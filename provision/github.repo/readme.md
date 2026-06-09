# github.repo

provisions repo-level resources for the declastruct-github repository.

## overview

resources provisioned:
- repo settings and config
- branch protection rules
- environments with deployment policies and team reviewers

## usage

```bash
# set admin credentials (ephemeral, requires admin:org scope PAT)
rhx keyrack set --owner admin --env sudo --key GITHUB_TOKEN --vault os.daemon

# source credentials
eval $(rhx keyrack source --owner admin --env sudo --key GITHUB_TOKEN)

# plan
npx declastruct plan --wish provision/github.repo/resources.ts --into provision/github.repo/.temp/plan.json

# apply
npx declastruct apply --plan provision/github.repo/.temp/plan.json
```

## ci/cd

on push to main, the `provision.yml` workflow runs automatically with the conformer app credentials.

## note on team reviewers

environments with `reviewers.teams` require the conformer app to have `organization.members: 'read'` permission. this is configured in `provision/github.apps/resources.app.declastruct-github.conformer.ts`.
