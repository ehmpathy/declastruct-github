import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclaredGithubRepo,
  DeclaredGithubRepoConfig,
  getDeclastructGithubProvider,
} from '../../../../../dist/contract/sdks';

/**
 * .what = provider configuration for acceptance tests
 * .why = enables declastruct CLI to interact with GitHub API
 */
export const getProviders = async () => [
  getDeclastructGithubProvider(
    {
      credentials: {
        token:
          process.env.GITHUB_TOKEN ??
          UnexpectedCodePathError.throw('github token not supplied'),
      },
    },
    {
      log: {
        info: () => {},
        debug: () => {},
        warn: console.warn,
        error: console.error,
      },
    },
  ),
];

/**
 * .what = resource declarations for acceptance tests
 * .why = defines desired state of declastruct-github-demo repo for testing
 */
export const getResources = async () => {
  const repo = DeclaredGithubRepo.as({
    owner: 'ehmpathy',
    name: 'declastruct-github-demo',
    description: 'demo repo for declastruct-github',
    homepage: null,
    private: false,
    visibility: 'public',
    archived: false,
  });

  const repoConfig = DeclaredGithubRepoConfig.as({
    repo,
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    hasDownloads: true,
    isTemplate: false,
    defaultBranch: 'main',
    allowSquashMerge: true,
    allowMergeCommit: false,
    allowRebaseMerge: false,
    allowAutoMerge: false,
    deleteBranchOnMerge: true,
    allowUpdateBranch: true,
  });

  return [repo, repoConfig];
};
