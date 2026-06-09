# github.org

this directory provisions org-level resources for the ehmpathy github organization.

## overview

resources provisioned:
- org profile and settings
- org member privileges
- org secrets and variables
- teams and team memberships

## usage

```bash
# set admin credentials (ephemeral, requires admin:org scope PAT)
rhx keyrack set --owner admin --env sudo --key GITHUB_TOKEN --vault os.daemon

# source credentials
eval $(rhx keyrack source --owner admin --env sudo --key GITHUB_TOKEN)

# plan
npx declastruct plan --wish provision/github.org/resources.ts --into provision/github.org/.temp/plan.json

# apply
npx declastruct apply --plan provision/github.org/.temp/plan.json
```

## resources

see `resources.ts` for declared resources:
- `DeclaredGithubOrg` - org profile
- `DeclaredGithubOrgMemberPrivileges` - org member permissions
- `DeclaredGithubOrgSecret` / `DeclaredGithubOrgVariable` - org-level secrets/variables
- `DeclaredGithubTeam` - teams
- `DeclaredGithubTeamMembership` - team memberships
