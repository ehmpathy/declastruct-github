import { DeclaredResource } from 'declastruct';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from '../../src/contract/sdks';

/**
 * .what = declares the declastruct-github app resources
 * .why = enables declarative management of the app that provisions github resources
 */
export const getResourcesOfAppDeclastructGithub = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'declastruct-github',
    name: 'Declastruct GitHub',
    description: 'Provisions GitHub resources declaratively via declastruct',
    homepageUrl: 'https://github.com/ehmpathy/declastruct-github',
    public: false,
    permissions: {
      // repo management
      administration: 'write',
      contents: 'write',
      metadata: 'read',
      // branch protection
      pullRequests: 'write',
    },
    events: [],
    webhookUrl: null,
  });

  // declare the installation on ehmpathy org
  const installation = DeclaredGithubAppInstallation.as({
    app: { owner, slug: app.slug },
    target: owner,
    repositorySelection: 'all',
    repositories: null,
  });

  return [app, installation];
};
