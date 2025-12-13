import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';

/**
 * .what = checks if context contains a GitHub Personal Access Token (PAT)
 * .why = different GitHub API endpoints require different token types; PATs have different permissions than app tokens
 */
export const hasContextWithPatToken = (
  _input: null,
  context: ContextGithubApi,
): boolean => {
  const token = context.github.token;

  // classic PAT format
  const isClassicPat = token.startsWith('ghp_');

  // fine-grained PAT format
  const isFineGrainedPat = token.startsWith('github_pat_');

  return isClassicPat || isFineGrainedPat;
};
