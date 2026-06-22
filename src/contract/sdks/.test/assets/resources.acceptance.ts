import { ConstraintError } from 'helpful-errors';
import { genContextLogTrail } from 'sdk-logs';

import {
  DeclaredGithubEnvironment,
  DeclaredGithubRepo,
  DeclaredGithubRepoConfig,
  DeclaredGithubTeam,
  DeclaredGithubTeamMembership,
  DeclaredGithubTeamRepoAccess,
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
          ConstraintError.throw('GITHUB_TOKEN not supplied', {
            env: 'GITHUB_TOKEN',
            hint: 'run: eval $(rhx keyrack source --owner ehmpath --env test)',
          }),
      },
    },
    genContextLogTrail({ trail: null, env: null }),
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
    allowAutoMerge: true,
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

  /**
   * .what = acceptance test team
   * .why = validates team provision via declastruct
   */
  const team = DeclaredGithubTeam.as({
    org: { login: 'ehmpathy' },
    slug: 'declastruct-acceptance-test-team',
    name: 'Declastruct Acceptance Test Team',
    description: 'team for declastruct-github acceptance tests',
    privacy: 'closed',
    notifications: 'disabled',
    parent: null,
  });

  /**
   * .what = acceptance test child team
   * .why = validates nested team provision via declastruct
   */
  const childTeam = DeclaredGithubTeam.as({
    org: { login: 'ehmpathy' },
    slug: 'declastruct-acceptance-test-child-team',
    name: 'Declastruct Acceptance Test Child Team',
    description: 'child team for declastruct-github acceptance tests',
    privacy: 'closed',
    notifications: 'disabled',
    parent: {
      org: { login: 'ehmpathy' },
      slug: 'declastruct-acceptance-test-team',
    },
  });

  /**
   * .what = acceptance test team membership
   * .why = validates team membership provision via declastruct
   */
  const teamMembership = DeclaredGithubTeamMembership.as({
    team: {
      org: { login: 'ehmpathy' },
      slug: 'declastruct-acceptance-test-team',
    },
    username: 'uladkasach',
    role: 'maintainer',
  });

  /**
   * .what = acceptance test team repo access
   * .why = validates team repo access provision via declastruct
   *        and enables team to be environment reviewer
   */
  const teamRepoAccess = DeclaredGithubTeamRepoAccess.as({
    team: {
      org: { login: 'ehmpathy' },
      slug: 'declastruct-acceptance-test-team',
    },
    repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
    permission: 'push',
  });

  return [
    repo,
    repoConfig,
    environment,
    productionOnMain,
    productionOnElse,
    team,
    childTeam,
    teamMembership,
    teamRepoAccess,
  ];
};
