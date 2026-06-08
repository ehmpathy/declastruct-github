import type { Endpoints } from '@octokit/types';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubTeamMembership } from '@src/domain.objects/DeclaredGithubTeamMembership';

type GithubTeamMembershipResponse =
  Endpoints['GET /orgs/{org}/teams/{team_slug}/memberships/{username}']['response']['data'];

/**
 * .what = casts GitHub API team membership response to DeclaredGithubTeamMembership
 * .why = transforms external API shape to our domain model with type safety
 */
export const castToDeclaredGithubTeamMembership = (input: {
  data: GithubTeamMembershipResponse;
  org: string;
  teamSlug: string;
  username: string;
}): HasMetadata<DeclaredGithubTeamMembership> => {
  return DeclaredGithubTeamMembership.as({
    team: {
      org: { login: input.org },
      slug: input.teamSlug,
    },
    username: input.username,
    role: input.data.role === 'maintainer' ? 'maintainer' : 'member',
  }) as HasMetadata<DeclaredGithubTeamMembership>;
};
