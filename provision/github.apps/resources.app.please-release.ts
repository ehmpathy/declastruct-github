import { DeclaredResource } from 'declastruct';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from '../../src/contract/sdks';

/**
 * .what = declares the please-release app resources
 * .why = enables declarative management of the app that handles release-please workflows
 */
export const getResourcesOfAppPleaseRelease = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'please-release',
    name: 'Please Release',
    description: 'Automates release-please workflows with GitHub App authentication',
    homepageUrl: 'https://github.com/ehmpathy/please-release',
    public: false,
    permissions: {
      // release workflow needs
      contents: 'write',
      pullRequests: 'write',
      metadata: 'read',
    },
    events: ['push', 'pull_request'],
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
