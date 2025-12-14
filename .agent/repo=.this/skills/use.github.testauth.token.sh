#!/usr/bin/env bash
# .what = provides admin access to the `github.com/ehmpathy/declastruct-github-demo` repo
# .how = usage (export): source .agent/repo=.this/skills/use.github.testauth.token.sh

# Fail fast if not sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  echo "Error: This script must be sourced, not executed directly." >&2
  echo "Usage: source ${BASH_SOURCE[0]}" >&2
  exit 1
fi

# paths
REPO_ROOT="$(git root)"
TOKEN_CACHE_FILE="$REPO_ROOT/.agent/.temp/github.testauth.token"
EXPIRY_CACHE_FILE="$REPO_ROOT/.agent/.temp/github.testauth.expiry"

# ensure temp dir exists
mkdir -p "$REPO_ROOT/.agent/.temp"

# check for cached token
if [[ -f "$TOKEN_CACHE_FILE" && -f "$EXPIRY_CACHE_FILE" ]]; then
  CACHED_TOKEN=$(cat "$TOKEN_CACHE_FILE")
  CACHED_EXPIRY=$(cat "$EXPIRY_CACHE_FILE")
  NOW=$(date +%s)

  # use cached token if not expired (with 5 min buffer)
  if [[ $NOW -lt $((CACHED_EXPIRY - 300)) ]]; then
    export GITHUB_TOKEN="$CACHED_TOKEN"
    MINS_LEFT=$(( (CACHED_EXPIRY - NOW) / 60 ))
    >&2 echo ""
    >&2 echo "🔑 using cached token (expires in ${MINS_LEFT}m)"
    >&2 echo ""
    return 0
  fi
fi

# token expired or missing - need to get a new one
# check if running in interactive terminal
if [[ -t 0 && -t 1 ]]; then
  # interactive: run the alias to get a new token
  >&2 echo ""
  >&2 echo "🔄 token expired or missing, refreshing..."
  >&2 echo ""

  # get new token using the get_github_app_token function
  NEW_TOKEN=$(get_github_app_token \
    ehmpathy \
    "$(op item get github.app.declastruct-test-auth --fields label=app_id --format json | jq -r .value)" \
    "$(op item get github.app.declastruct-test-auth --fields label=app_private_key --format json | jq -r .value)")

  if [[ -z "$NEW_TOKEN" || "$NEW_TOKEN" == "null" ]]; then
    >&2 echo "error: failed to get token"
    return 1
  fi

  # cache the token (expires in 1 hour)
  echo "$NEW_TOKEN" > "$TOKEN_CACHE_FILE"
  echo $(($(date +%s) + 3600)) > "$EXPIRY_CACHE_FILE"

  export GITHUB_TOKEN="$NEW_TOKEN"
  return 0
else
  # non-interactive: inform agent to ask their human to sign in
  >&2 echo ""
  >&2 echo "❌ GITHUB_TOKEN expired or missing"
  >&2 echo ""
  >&2 echo "[agent]: ask your human to sign in first by running this in their terminal:"
  >&2 echo ""
  >&2 echo "  source .agent/repo=.this/skills/use.github.testauth.token.sh"
  >&2 echo ""
  return 1
fi
