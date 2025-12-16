import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import {
  type DeclaredGithubAppOrganizationPermissions,
  DeclaredGithubAppPermissions,
  type DeclaredGithubAppRepositoryPermissions,
} from '../../domain.objects/DeclaredGithubAppPermissions';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';

type GithubAppResponse = Endpoints['GET /apps/{app_slug}']['response']['data'];

/**
 * .what = casts GitHub API app response to DeclaredGithubApp
 * .why = transforms external API shape to our domain model with type safety and validation
 */
export const castToDeclaredGithubApp = (
  input: GithubAppResponse,
  options?: { inferredPublic?: boolean },
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
    UnexpectedCodePathError.throw(
      'owner login/type not found on app response',
      {
        input,
        ownerData,
      },
    );
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

  // cast permissions from snake_case to camelCase with nested structure
  const permissions = castPermissions(input.permissions ?? {});

  return DeclaredGithubApp.as({
    id,
    slug,
    owner,
    name: input.name ?? null,
    description: input.description
      ? input.description
          .split('\n')
          .map((line) => line.trimEnd()) // normalize trailing whitespace per line
          .join('\n')
          .trim() // normalize leading/trailing whitespace
      : null,
    public: (() => {
      // use API response if available
      if ('public' in input)
        return Boolean((input as { public?: boolean }).public);
      // use inferred value if provided
      if (options?.inferredPublic !== undefined) return options.inferredPublic;
      // fail fast - never default
      throw new UnexpectedCodePathError(
        'public field not in API response and no inference provided',
        { input },
      );
    })(),
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
 * .why = transforms snake_case API keys to camelCase domain model with nested repository/organization structure
 */
const castPermissions = (
  input: Record<string, string | undefined>,
): DeclaredGithubAppPermissions => {
  // map snake_case keys to camelCase for repository permissions
  const repositoryKeyMap: Record<
    string,
    keyof DeclaredGithubAppRepositoryPermissions
  > = {
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
    repository_hooks: 'hooks',
  };

  // map snake_case keys to camelCase for organization permissions
  const organizationKeyMap: Record<
    string,
    keyof DeclaredGithubAppOrganizationPermissions
  > = {
    organization_administration: 'administration',
    members: 'members',
    organization_custom_properties: 'customProperties',
    organization_user_blocking: 'userBlocking',
    organization_hooks: 'hooks',
    organization_secrets: 'actionsSecrets',
    organization_actions_variables: 'actionsVariables',
    organization_projects: 'projects',
    organization_self_hosted_runners: 'selfHostedRunners',
  };

  // build the repository permissions object
  const repository: Record<string, string | null> = {};
  for (const [snakeKey, value] of Object.entries(input)) {
    const camelKey = repositoryKeyMap[snakeKey];
    if (camelKey && value) {
      repository[camelKey] = value;
    }
  }

  // build the organization permissions object
  const organization: Record<string, string | null> = {};
  for (const [snakeKey, value] of Object.entries(input)) {
    const camelKey = organizationKeyMap[snakeKey];
    if (camelKey && value) {
      organization[camelKey] = value;
    }
  }

  return new DeclaredGithubAppPermissions({
    repository:
      Object.keys(repository).length > 0
        ? (repository as unknown as DeclaredGithubAppRepositoryPermissions)
        : null,
    organization:
      Object.keys(organization).length > 0
        ? (organization as unknown as DeclaredGithubAppOrganizationPermissions)
        : null,
  });
};
