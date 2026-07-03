# github.org

this directory provisions org-level resources for the ehmpathy github organization.

## overview

resources provisioned:
- org profile and settings
- org member privileges
- org secrets and variables
- teams and team memberships

## usage

recommended: reuse your authed `gh` session for a short-lived admin token. no PAT to mint or store.

```bash
# one-time: widen your gh session to admin:org scope
gh auth refresh -h github.com -s admin:org

# export the token for declastruct
export GITHUB_TOKEN=$(gh auth token)

# plan
npx declastruct plan --wish provision/github.org/resources.ts --into provision/github.org/.temp/plan.json

# apply
npx declastruct apply --plan provision/github.org/.temp/plan.json
```

<details>
<summary>alternative: keyrack sudo PAT</summary>

```bash
# set admin credentials (ephemeral, requires admin:org scope PAT)
rhx keyrack set --owner admin --env sudo --key GITHUB_TOKEN --vault os.daemon

# source credentials
eval $(rhx keyrack source --owner admin --env sudo --key GITHUB_TOKEN)
```

</details>

## resources

see `resources.ts` for declared resources:
- `DeclaredGithubOrg` - org profile
- `DeclaredGithubOrgMemberPrivileges` - org member permissions
- `DeclaredGithubOrgSecret` / `DeclaredGithubOrgVariable` - org-level secrets/variables
- `DeclaredGithubTeam` - teams
- `DeclaredGithubTeamMembership` - team memberships
