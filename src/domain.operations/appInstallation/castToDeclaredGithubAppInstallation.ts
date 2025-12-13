import { asUniDateTime } from '@ehmpathy/uni-time';
import type { Endpoints } from '@octokit/types';
import { refByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';

import { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';

type GithubInstallationResponse =
  | Endpoints['GET /orgs/{org}/installation']['response']['data']
  | Endpoints['GET /users/{username}/installation']['response']['data']
  | Endpoints['GET /repos/{owner}/{repo}/installation']['response']['data']
  | Endpoints['GET /app/installations/{installation_id}']['response']['data'];

/**
 * .what = casts GitHub API installation response to DeclaredGithubAppInstallation
 * .why = transforms external API shape to our domain model with type safety and validation
 * .note = requires app reference to be passed in since installation response doesn't include app owner
 */
export const castToDeclaredGithubAppInstallation = (input: {
  installation: GithubInstallationResponse;
  app: { owner: DeclaredGithubOwner; slug: string };
  repositories: string[] | null;
}): HasMetadata<DeclaredGithubAppInstallation> => {
  const { installation, app } = input;

  // extract account info
  const account = installation.account;
  if (!account)
    UnexpectedCodePathError.throw('installation account not found', {
      installation,
    });

  // extract login from account (type narrowing)
  const targetSlug = 'login' in account ? (account.login as string) : undefined;
  if (!targetSlug)
    UnexpectedCodePathError.throw('installation account login not found', {
      installation,
      account,
    });

  // extract target type
  const targetType = installation.target_type;
  if (!targetType)
    UnexpectedCodePathError.throw('installation target_type not found', {
      installation,
    });

  // compose target object
  const target = new DeclaredGithubOwner({
    type: targetType.toLowerCase() as 'organization' | 'user',
    slug: targetSlug,
  });

  // extract repository selection
  const repositorySelection = (installation.repository_selection ?? 'all') as
    | 'all'
    | 'selected';

  return DeclaredGithubAppInstallation.as({
    id: installation.id,
    app:
      app instanceof DeclaredGithubApp
        ? refByUnique<typeof DeclaredGithubApp>(app)
        : app,
    target,
    repositorySelection,
    repositories: input.repositories,
    suspended: installation.suspended_at !== null,
    createdAt: installation.created_at
      ? asUniDateTime(installation.created_at)
      : undefined,
    updatedAt: installation.updated_at
      ? asUniDateTime(installation.updated_at)
      : undefined,
  }) as HasMetadata<DeclaredGithubAppInstallation>;
};
