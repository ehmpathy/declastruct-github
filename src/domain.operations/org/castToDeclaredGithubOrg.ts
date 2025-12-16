import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import { assure, type HasMetadata, isPresent } from 'type-fns';

import { DeclaredGithubOrg } from '../../domain.objects/DeclaredGithubOrg';

type GithubOrgResponse = Endpoints['GET /orgs/{org}']['response']['data'];

/**
 * .what = casts GitHub API org response to DeclaredGithubOrg
 * .why = transforms external API shape to our domain model with type safety and validation
 */
export const castToDeclaredGithubOrg = (input: {
  data: GithubOrgResponse;
}): HasMetadata<DeclaredGithubOrg> => {
  return DeclaredGithubOrg.as({
    id: assure(input.data.id, isPresent),
    login: assure(input.data.login, isPresent),
    name: input.data.name ?? null,
    description: input.data.description ?? null,
    billingEmail: undefined, // write-only: not read back from API
    twoFactorRequirementEnabled:
      input.data.two_factor_requirement_enabled ?? undefined,
    publicRepos: input.data.public_repos ?? undefined,
    createdAt: input.data.created_at
      ? asUniDateTime(input.data.created_at)
      : undefined,
    updatedAt: input.data.updated_at
      ? asUniDateTime(input.data.updated_at)
      : undefined,
  }) as HasMetadata<DeclaredGithubOrg>;
};
