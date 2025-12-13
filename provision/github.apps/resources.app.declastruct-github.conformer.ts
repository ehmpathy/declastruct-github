import { DeclaredResource } from 'declastruct';

import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from '../../src/contract/sdks';

/**
 * .what = declares the declastruct-github app resources
 * .why = enables declarative management of the app that is used to self control github repos
 */
export const getResourcesOfAppDeclastructGithubConformer = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({ type: 'organization', slug: 'ehmpathy' });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'declastruct-github-conformer',
    name: 'Declastruct GitHub Conformer',
    description: `
grants the narrowest auth possible to conform github repos to your chosen standards via declastruct-github with short-lived github app tokens. (github, where is your oidc auth?)

[important!]: it still requires repo.admin auth for branch-protection. ensure that your organization denies the ability of members to delete or transfer repos at https://github.com/organizations/__YOUR_ORG__/settings/member_privileges
    `.trim(),
    homepageUrl: 'https://github.com/ehmpathy/declastruct-github',
    public: true,

    // uses the narrowest set of permissions possible in order to control provision/github/declastruct.resources.ts
    permissions: {
      repository: {
        // DeclaredGithubRepo, DeclaredGithubRepoConfig, DeclaredGithubBranchProtection
        administration: 'write', // !: important! this is a nuclear option! ensure that your organization denies the ability of members to delete or transfer repos; e.g., https://github.com/organizations/ehmpathy/settings/member_privileges

        // always required
        metadata: 'read',
      },
      organization: null,
    },
    events: [],
    webhookUrl: null,
  });

  // declare the installation on ehmpathy org, to start with
  const installation = DeclaredGithubAppInstallation.as({
    app: { owner, slug: app.slug },
    target: owner,
    repositorySelection: 'all',
    repositories: null,
  });

  return [app, installation];
};
