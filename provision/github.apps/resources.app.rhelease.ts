import { DeclaredResource } from 'declastruct';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from '../../src/contract/sdks';

/**
 * .what = declares the please-release app resources
 * .why = enables declarative management of the app that handles release-please workflows
 *
 * .todo = move this into its own repo at `https://github.com/ehmpathy/rhelease`
 */
export const getResourcesOfAppRhelease = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'rhelease',
    name: 'rhelease',
    description: 'grants the narrowest auth possible to power please-release workflows with short-lived github app tokens. (github, where is your oidc auth?)',
    homepageUrl: 'https://github.com/ehmpathy/rhelease',
    public: false,
    permissions: {
      repository: {
        // release workflow needs
        contents: 'write', // for changelogs and tags
        metadata: 'read', // always required
        pullRequests: 'write', // for release prs
      },
      organization: null,
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
