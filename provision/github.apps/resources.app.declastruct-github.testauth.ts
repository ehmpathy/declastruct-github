import { DeclaredResource } from 'declastruct';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from '../../src/contract/sdks';

/**
 * .what = declares the declastruct-github-prepare app resources
 * .why = enables declarative management of the app that is used to prepare the declastruct-github tool
 */
export const getResourcesOfAppDeclastructGithubTestAuth = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'declastruct-github-test-auth',
    name: 'Declastruct GitHub Test Auth',
    description: 'grant narrow auth to test within the declastruct-github repo with short-lived github app tokens',
    homepageUrl: 'https://github.com/ehmpathy/declastruct-github',
    public: false,

    // wide permissions are safe here because installation is scoped to demo repos only
    permissions: {
      repository: {
        metadata: 'read', // always required

        // DeclaredGithubRepo, DeclaredGithubRepoConfig, DeclaredGithubBranchProtection
        administration: 'write',
        // DeclaredGithubBranch
        contents: 'write',
      },
      organization: {
        // DeclaredGithubAppInstallation (list installations on org)
        administration: 'read',
      },
    },
    events: [],
    webhookUrl: null,
  });

  // declare the installation on ehmpathy org, to start with
  const installation = DeclaredGithubAppInstallation.as({
    app: { owner, slug: app.slug },
    target: owner,
    repositorySelection: 'selected',
    repositories: ['declastruct-github-demo'],
  });

  return [app, installation];
};
