import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclaredGithubEnvironment,
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
    visibility: 'public',
  });

  const repoConfig = DeclaredGithubRepoConfig.as({
    repo,
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    isTemplate: false,
    defaultBranch: 'main',
    allowSquashMerge: true,
    allowMergeCommit: false,
    allowRebaseMerge: false,
    allowAutoMerge: false,
    deleteBranchOnMerge: true,
    allowUpdateBranch: true,
  });

  const environment = DeclaredGithubEnvironment.as({
    repo,
    name: 'acceptance-test-env',
    reviewers: null,
    waitTimer: null,
    deploymentBranchPolicy: {
      customBranches: ['main'],
    },
    preventSelfReview: false,
  });

  /**
   * .what = production-on-main environment
   * .why = demonstrates main-only deploys where PR approval is the gate
   */
  const productionOnMain = DeclaredGithubEnvironment.as({
    repo,
    name: 'production-on-main',
    reviewers: null,
    waitTimer: null,
    deploymentBranchPolicy: {
      customBranches: ['main'],
    },
    preventSelfReview: false,
  });

  /**
   * .what = production-on-else environment
   * .why = demonstrates hotfix/preview deploys with required reviewers
   */
  const productionOnElse = DeclaredGithubEnvironment.as({
    repo,
    name: 'production-on-else',
    reviewers: {
      users: ['uladkasach'],
      teams: null,
    },
    waitTimer: null,
    deploymentBranchPolicy: null, // all branches
    preventSelfReview: true,
  });

  return [repo, repoConfig, environment, productionOnMain, productionOnElse];
};
