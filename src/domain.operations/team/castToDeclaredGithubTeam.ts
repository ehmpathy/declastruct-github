import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import { assure, type HasMetadata, isPresent } from 'type-fns';

import { DeclaredGithubTeam } from '@src/domain.objects/DeclaredGithubTeam';

type GithubTeamResponse =
  Endpoints['GET /orgs/{org}/teams/{team_slug}']['response']['data'];

/**
 * .what = casts GitHub API team response to DeclaredGithubTeam
 * .why = transforms external API shape to our domain model with type safety
 */
export const castToDeclaredGithubTeam = (input: {
  data: GithubTeamResponse;
  org: string;
}): HasMetadata<DeclaredGithubTeam> => {
  return DeclaredGithubTeam.as({
    id: assure(input.data.id, isPresent),
    createdAt: input.data.created_at
      ? asUniDateTime(input.data.created_at)
      : undefined,
    updatedAt: input.data.updated_at
      ? asUniDateTime(input.data.updated_at)
      : undefined,
    org: { login: input.org },
    slug: assure(input.data.slug, isPresent),
    name: assure(input.data.name, isPresent),
    description: input.data.description ?? null,
    privacy: input.data.privacy === 'secret' ? 'secret' : 'closed',
    notifications:
      input.data.notification_setting === 'notifications_enabled'
        ? 'enabled'
        : 'disabled',
    parent: input.data.parent
      ? {
          org: { login: input.org },
          slug: input.data.parent.slug,
        }
      : null,
  }) as HasMetadata<DeclaredGithubTeam>;
};
