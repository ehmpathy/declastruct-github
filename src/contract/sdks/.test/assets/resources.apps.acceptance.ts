import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  getDeclastructGithubProvider,
} from '../../../../../src/contract/sdks';

/**
 * .what = provider configuration for GitHub Apps acceptance tests
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
 * .what = resource declarations for GitHub Apps acceptance tests
 * .why = defines desired state of demo app for testing declastruct-github
 */
export const getResources = async () => {
  // declare the demo app for acceptance testing
  const demoApp = DeclaredGithubApp.as({
    owner: { type: 'organization', slug: 'ehmpathy' },
    slug: 'declastruct-github-demo-app',
    name: 'Declastruct GitHub Demo App',
    description: 'Demo GitHub App for declastruct-github acceptance tests',
    homepageUrl: 'https://github.com/ehmpathy/declastruct-github',
    public: true, // required to be able to read with test creds after create
    permissions: {
      repository: {
        contents: 'read',
        metadata: 'read',
      },
      organization: null,
    },
    events: [],
    webhookUrl: null,
  });

  // declare installation on ehmpathy org
  const demoInstallation = DeclaredGithubAppInstallation.as({
    app: { owner: demoApp.owner, slug: demoApp.slug },
    target: { type: 'organization', slug: 'ehmpathy' },
    repositorySelection: 'selected',
    repositories: ['declastruct-github-demo'],
  });

  return [demoApp, demoInstallation];
};
