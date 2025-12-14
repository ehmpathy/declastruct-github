import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';

/**
 * .what = checks if context contains a GitHub App installation token
 * .why = different GitHub API endpoints require different token types; app tokens have different scopes than PATs
 */
export const hasContextWithAppToken = (
  _input: null,
  context: ContextGithubApi,
): boolean => {
  const token = context.github.token;

  // GitHub App installation token format (server-to-server token)
  const isAppToken = token.startsWith('ghs_');

  return isAppToken;
};
