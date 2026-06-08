# github.org

this directory provisions org-level resources for the ehmpathy github organization.

## overview

resources provisioned:
- org profile and settings
- org member privileges
- org secrets and variables
- teams and team memberships

## keyrack credentials

store github admin token in keyrack:

```bash
# set github admin token (admin:org scope required)
rhx keyrack set --owner admin --key GITHUB_TOKEN --vault os.daemon
```

## usage

### plan

```bash
eval $(rhx keyrack source --owner admin --env sudo)
npx declastruct plan \
  --wish provision/github.org/resources.ts \
  --into ./provision/github.org/.temp/plan.json
```

### apply

```bash
eval $(rhx keyrack source --owner admin --env sudo)
npx declastruct apply \
  --plan ./provision/github.org/.temp/plan.json
```

## resources

see `resources.ts` for declared resources:
- `DeclaredGithubOrg` - org profile
- `DeclaredGithubOrgMemberPrivileges` - org member permissions
- `DeclaredGithubOrgSecret` / `DeclaredGithubOrgVariable` - org-level secrets/variables
- `DeclaredGithubTeam` - teams
- `DeclaredGithubTeamMembership` - team memberships
