import { DeclastructProvider } from 'declastruct';
import { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import { getDeclastructGithubProvider } from '../../src/contract/sdks';
import { getResourcesOfAppDeclastructGithubConformer } from './resources.app.declastruct-github.conformer';
import { getResourcesOfAppDeclastructGithubTestAuth } from './resources.app.declastruct-github.testauth';
import { getResourcesOfAppRhelease } from './resources.app.rhelease';

/**
 * .what = declastruct provider configuration for github apps
 * .why = enables declastruct CLI to interact with GitHub API
 */
export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getDeclastructGithubProvider(
    {
      credentials: {
        token:
          process.env.GITHUB_TOKEN ??
          UnexpectedCodePathError.throw('GITHUB_TOKEN not set'),
      },
    },
    {
      log: {
        info: () => { },
        debug: () => { },
        warn: console.warn,
        error: console.error,
      },
    },
  ),
];

/**
 * .what = all github app resource declarations
 * .why = composes all app resources for unified provisioning
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // gather all app resources
  const resourcesOfAppDeclastructGithubTestAuth = await getResourcesOfAppDeclastructGithubTestAuth();
  const resourcesOfAppDeclastructGithubConformer = await getResourcesOfAppDeclastructGithubConformer();
  const resourcesOfAppRhelease = await getResourcesOfAppRhelease();

  return [
    // app to run declastruct-github for test usecases
    ...resourcesOfAppDeclastructGithubTestAuth,

    // app to run declastruct-github for repo-conform usecases
    ...resourcesOfAppDeclastructGithubConformer,

    // app to run rhelease
    ...resourcesOfAppRhelease,
  ];
};
