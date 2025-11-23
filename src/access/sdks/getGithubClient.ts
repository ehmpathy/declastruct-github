import { Octokit } from '@octokit/rest';
import { createCache } from 'simple-in-memory-cache';
import { withSimpleCache } from 'with-simple-cache';

import { ContextGithubApi } from '../../domain.objects/ContextGithubApi';

/**
 * .what = returns a cached GitHub API client instance
 * .why = prevents redundant Octokit instantiation while maintaining proper auth context
 */
export const getGithubClient = withSimpleCache(
  (input: unknown, context: ContextGithubApi) =>
    new Octokit({ auth: context.github.token }),
  { cache: createCache() },
);
