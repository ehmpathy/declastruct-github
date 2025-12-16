import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import type { RefByUnique } from 'domain-objects';
import type { HasMetadata } from 'type-fns';

import type { DeclaredGithubOrg } from '../../domain.objects/DeclaredGithubOrg';
import { DeclaredGithubOrgSecret } from '../../domain.objects/DeclaredGithubOrgSecret';

type GithubOrgSecretResponse =
  Endpoints['GET /orgs/{org}/actions/secrets/{secret_name}']['response']['data'];

type GithubOrgSecretListItem =
  Endpoints['GET /orgs/{org}/actions/secrets']['response']['data']['secrets'][number];

/**
 * .what = casts GitHub API secret response to DeclaredGithubOrgSecret
 * .why = transforms external API shape to our domain model
 * .note = value is NEVER returned - secrets are write-only
 */
export const castToDeclaredGithubOrgSecret = (input: {
  data: GithubOrgSecretResponse | GithubOrgSecretListItem;
  org: RefByUnique<typeof DeclaredGithubOrg>;
}): HasMetadata<DeclaredGithubOrgSecret> => {
  return DeclaredGithubOrgSecret.as({
    org: input.org,
    name: input.data.name,
    // value is NEVER returned from API - secrets are write-only
    value: undefined,
    visibility: input.data.visibility as 'all' | 'private' | 'selected',
    // selectedRepositoryNames not set - not returned in API response
    createdAt: input.data.created_at
      ? asUniDateTime(input.data.created_at)
      : undefined,
    updatedAt: input.data.updated_at
      ? asUniDateTime(input.data.updated_at)
      : undefined,
  }) as HasMetadata<DeclaredGithubOrgSecret>;
};
