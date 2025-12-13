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

## Local Usage (CLI)

To get short-lived access tokens locally using your GitHub App credentials.

### Bash Function

Add this function to your `~/.bashrc` or `~/.zshrc`:

```bash
# generates a short-lived github app installation access token (valid for 1 hour)
# usage: get_github_app_token <org> <app_id> <private_key>
get_github_app_token() {
  # prepare the jwt
  local ORG="$1" APP_ID="$2" PRIVATE_KEY="$3"
  local NOW=$(date +%s)
  local IAT=$((NOW - 60)) EXP=$((NOW + 600))
  local HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  local PAYLOAD=$(echo -n "{\"iat\":${IAT},\"exp\":${EXP},\"iss\":\"${APP_ID}\"}" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  local KEY_FILE=$(mktemp)
  echo -e "$PRIVATE_KEY" > "$KEY_FILE"
  local SIGNATURE=$(echo -n "${HEADER}.${PAYLOAD}" | openssl dgst -sha256 -sign "$KEY_FILE" 2>/dev/null | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  rm -f "$KEY_FILE"
  if [[ -z "$SIGNATURE" ]]; then >&2 echo "error: failed to sign jwt (check private key format)"; return 1; fi

  # get the installation
  local JWT="${HEADER}.${PAYLOAD}.${SIGNATURE}"
  local INSTALLATION=$(curl -s -H "Authorization: Bearer $JWT" -H "Accept: application/vnd.github+json" "https://api.github.com/orgs/${ORG}/installation")
  local ERROR=$(echo "$INSTALLATION" | jq -r '.message // empty')
  if [[ -n "$ERROR" ]]; then >&2 echo "error: $ERROR"; return 1; fi

  # grab a token
  local INSTALLATION_ID=$(echo "$INSTALLATION" | jq '.id')
  local TOKEN_RESP=$(curl -s -X POST -H "Authorization: Bearer $JWT" -H "Accept: application/vnd.github+json" "https://api.github.com/app/installations/${INSTALLATION_ID}/access_tokens")
  local TOKEN=$(echo "$TOKEN_RESP" | jq -r '.token // empty')
  if [[ -z "$TOKEN" ]]; then >&2 echo "error: $(echo "$TOKEN_RESP" | jq -r '.message // "failed to get token"')"; return 1; fi

  # verify identity (output to stderr so it doesn't get captured in GITHUB_TOKEN=$(...) usage)
  local APP_SLUG=$(echo "$INSTALLATION" | jq -r '.app_slug')
  local REPOS=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/installation/repositories" | jq -r '[.repositories[].name] | join(", ") // empty')
  >&2 echo ""
  >&2 echo "🔑 authentication succeeded"
  >&2 echo "├─ as: ${APP_SLUG}[bot]"
  >&2 echo "├─ org: ${ORG}"
  >&2 echo "└─ repos: ${REPOS:-all}"
  >&2 echo ""
  echo "$TOKEN"
}
```

### 1Password Integration

Store your GitHub App credentials in 1Password, then add aliases to your shell config:

```bash
# 1password item structure:
#   - item name: "github.app.declastruct-test-auth"
#   - fields:
#     - app_id: "123456"
#     - app_private_key: "-----BEGIN RSA PRIVATE KEY-----\n..." (use literal `\n` instead of newlines since 1pass doesnt support them)

# alias to export GITHUB_TOKEN with short-lived app token
alias use.github.declastruct.test='export GITHUB_TOKEN=$(get_github_app_token \
  ehmpathy \
  "$(op item get github.app.declastruct-test-auth --fields label=app_id --format json | jq -r .value)" \
  "$(op item get github.app.declastruct-test-auth --fields label=app_private_key --format json | jq -r .value)")'
```

Usage:
```bash
# activate the token (valid for 1 hour)
use.github.declastruct.test

# now run commands that need GITHUB_TOKEN
npm run test:integration
npx declastruct plan --wish ./provision/github.apps/resources.ts --into ./plan.json
```

### Comparison with PAT

```bash
# PAT approach (long-lived, broad permissions)
alias use.github.admin='export GITHUB_TOKEN=$(op item get github.admin.pat --fields label=password --format json | jq -r .value)'

# App approach (short-lived, scoped permissions)
alias use.github.declastruct.test='export GITHUB_TOKEN=$(get_github_app_token ...)'
```
