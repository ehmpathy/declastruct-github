import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import type { RefByUnique } from 'domain-objects';
import type { HasMetadata } from 'type-fns';

import type { DeclaredGithubOrg } from '../../domain.objects/DeclaredGithubOrg';
import { DeclaredGithubOrgVariable } from '../../domain.objects/DeclaredGithubOrgVariable';

type GithubOrgVariableResponse =
  Endpoints['GET /orgs/{org}/actions/variables/{name}']['response']['data'];

type GithubOrgVariableListItem =
  Endpoints['GET /orgs/{org}/actions/variables']['response']['data']['variables'][number];

/**
 * .what = casts GitHub API variable response to DeclaredGithubOrgVariable
 * .why = transforms external API shape to our domain model
 */
export const castToDeclaredGithubOrgVariable = (input: {
  data: GithubOrgVariableResponse | GithubOrgVariableListItem;
  org: RefByUnique<typeof DeclaredGithubOrg>;
}): HasMetadata<DeclaredGithubOrgVariable> => {
  return DeclaredGithubOrgVariable.as({
    org: input.org,
    name: input.data.name,
    value: input.data.value,
    visibility: input.data.visibility as 'all' | 'private' | 'selected',
    // selectedRepositoryNames not set - not returned in API response
    createdAt: input.data.created_at
      ? asUniDateTime(input.data.created_at)
      : undefined,
    updatedAt: input.data.updated_at
      ? asUniDateTime(input.data.updated_at)
      : undefined,
  }) as HasMetadata<DeclaredGithubOrgVariable>;
};
