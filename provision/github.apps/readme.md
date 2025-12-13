# GitHub Apps Provisioning

This directory houses the declared GitHub Apps used by the ehmpathy org.

We collocate them within this repo to demonstrate how these resources can be used and to dogfood our releases.

## Structure

```
provision/github.apps/
├── readme.md                              # this file
├── resources.ts                           # main declastruct resources file
├── resources.app.declastruct-github.ts    # declastruct-github app declaration
└── resources.app.please-release.ts        # please-release app declaration
```

## Apps Declared

### declastruct-github

- **purpose**: provisions GitHub resources declaratively via declastruct
- **permissions**: administration (write), contents (write), metadata (read), pull_requests (write)
- **events**: none
- **installation**: all repos in ehmpathy org

### please-release

- **purpose**: automates release-please workflows with GitHub App authentication
- **permissions**: contents (write), pull_requests (write), metadata (read)
- **events**: push, pull_request
- **installation**: all repos in ehmpathy org

## Usage

### Generate a plan

```bash
GITHUB_TOKEN=<token> npx declastruct plan \
  --wish ./provision/github.apps/resources.ts \
  --into ./provision/github.apps/.temp/plan.json
```

### Apply the plan

```bash
GITHUB_TOKEN=<token> npx declastruct apply \
  --plan ./provision/github.apps/.temp/plan.json
```

## Workflow Integration

See `examples/workflows/github-app-token.yml` for an example of how to use these apps in GitHub Actions workflows with `actions/create-github-app-token`.

### Required Org Variables/Secrets

- `DECLASTRUCT_GITHUB_APP_ID` - the app ID (org variable)
- `DECLASTRUCT_GITHUB_APP_PRIVATE_KEY` - the app private key (org secret)

## Important Notes

1. **GitHub Apps cannot be created via API** - they must be created manually at:
   - https://github.com/organizations/ehmpathy/settings/apps/new

2. **Installations cannot be created via API** - they must be installed manually at:
   - https://github.com/apps/<app-slug>/installations/new

3. **declastruct-github will provide helpful errors** with the correct URLs when apps or installations need to be created or updated manually.

4. **Repository selection can be synced** - if an installation already exists with `repositorySelection: 'selected'`, declastruct can add/remove repos from the installation.
