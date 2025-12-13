import { DeclastructProvider } from 'declastruct';
import { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import { getDeclastructGithubProvider } from '../../src/contract/sdks';
import { getResourcesOfAppDeclastructGithub } from './resources.app.declastruct-github';
import { getResourcesOfAppPleaseRelease } from './resources.app.please-release';

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
        info: () => {},
        debug: () => {},
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
  const declastructGithubResources = await getResourcesOfAppDeclastructGithub();
  const pleaseReleaseResources = await getResourcesOfAppPleaseRelease();

  return [...declastructGithubResources, ...pleaseReleaseResources];
};
