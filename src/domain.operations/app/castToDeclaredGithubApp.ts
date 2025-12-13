import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import { UnexpectedCodePathError } from 'helpful-errors';
import { type HasMetadata } from 'type-fns';

import { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import { DeclaredGithubAppPermissions } from '../../domain.objects/DeclaredGithubAppPermissions';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';

type GithubAppResponse =
  Endpoints['GET /apps/{app_slug}']['response']['data'];

/**
 * .what = casts GitHub API app response to DeclaredGithubApp
 * .why = transforms external API shape to our domain model with type safety and validation
 */
export const castToDeclaredGithubApp = (
  input: GithubAppResponse,
): HasMetadata<DeclaredGithubApp> => {
  // fail fast if input is null
  if (!input) {
    UnexpectedCodePathError.throw('app response is null', { input });
  }

  // extract owner from owner object
  const ownerData = input.owner;
  if (!ownerData) {
    UnexpectedCodePathError.throw('owner not found on app response', { input });
  }
  const ownerLogin = 'login' in ownerData ? ownerData.login : null;
  const ownerType = 'type' in ownerData ? ownerData.type : null;
  if (!ownerLogin || !ownerType) {
    UnexpectedCodePathError.throw('owner login/type not found on app response', {
      input,
      ownerData,
    });
  }
  const owner = new DeclaredGithubOwner({
    type: ownerType.toLowerCase() as 'organization' | 'user',
    slug: ownerLogin,
  });

  // extract required fields
  const id = input.id;
  const slug = input.slug;
  if (!slug) {
    UnexpectedCodePathError.throw('slug not found on app response', { input });
  }

  // cast permissions from snake_case to camelCase
  const permissions = castPermissions(input.permissions ?? {});

  return DeclaredGithubApp.as({
    id,
    slug,
    owner,
    name: input.name ?? null,
    description: input.description ?? null,
    public:
      'public' in input
        ? Boolean((input as { public?: boolean }).public)
        : false,
    permissions,
    events: input.events ?? [],
    homepageUrl: input.external_url ?? null,
    webhookUrl: null, // not exposed in public API response
    createdAt: input.created_at ? asUniDateTime(input.created_at) : undefined,
    updatedAt: input.updated_at ? asUniDateTime(input.updated_at) : undefined,
  }) as HasMetadata<DeclaredGithubApp>;
};

/**
 * .what = casts GitHub API permissions object to DeclaredGithubAppPermissions
 * .why = transforms snake_case API keys to camelCase domain model
 */
const castPermissions = (
  input: Record<string, string | undefined>,
): DeclaredGithubAppPermissions => {
  // map snake_case keys to camelCase
  const keyMap: Record<string, keyof DeclaredGithubAppPermissions> = {
    contents: 'contents',
    pull_requests: 'pullRequests',
    issues: 'issues',
    actions: 'actions',
    administration: 'administration',
    metadata: 'metadata',
    deployments: 'deployments',
    checks: 'checks',
    code_scanning: 'codeScanning',
    secrets: 'secrets',
    workflows: 'workflows',
    environments: 'environments',
    pages: 'pages',
    packages: 'packages',
    repository_hooks: 'repositoryHooks',
    organization_administration: 'organizationAdministration',
    members: 'members',
    organization_custom_properties: 'organizationCustomProperties',
    organization_user_blocking: 'organizationUserBlocking',
    organization_hooks: 'organizationHooks',
    organization_secrets: 'organizationSecrets',
    organization_projects: 'organizationProjects',
    organization_self_hosted_runners: 'organizationSelfHostedRunners',
  };

  // build the permissions object
  const result: Record<string, string | null> = {};
  for (const [snakeKey, value] of Object.entries(input)) {
    const camelKey = keyMap[snakeKey];
    if (camelKey && value) {
      result[camelKey] = value;
    }
  }

  return new DeclaredGithubAppPermissions(
    result as unknown as DeclaredGithubAppPermissions,
  );
};
