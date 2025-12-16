import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubAppInstallation } from '@src/domain.objects/DeclaredGithubAppInstallation';
import { hasContextWithAppToken } from '@src/domain.operations/context/hasContextWithAppToken';
import { hasContextWithPatToken } from '@src/domain.operations/context/hasContextWithPatToken';

import { castToDeclaredGithubAppInstallation } from './castToDeclaredGithubAppInstallation';

/**
 * .what = gets a GitHub App installation by unique key
 * .why = retrieves current state of an installation from GitHub API for declarative management
 * .note = lookup by primary key (installation id) is not supported - requires App JWT auth
 */
export const getOneAppInstallation = asProcedure(
  async (
    input: {
      by: { unique: RefByUnique<typeof DeclaredGithubAppInstallation> };
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubAppInstallation> | null> => {
    // get cached GitHub client
    const github = getGithubClient({}, context);

    // handle get by unique key
    if (input.by.unique) {
      const { app, target } = input.by.unique;

      // list installations for the org/user and filter by app
      // uses GET /orgs/{org}/installations which works with PAT (admin:read scope)
      try {
        if (target.type === 'organization') {
          const response = await github.orgs.listAppInstallations({
            org: target.slug,
            per_page: 100,
          });

          // find installation matching app slug
          const installation = response.data.installations.find(
            (inst) => inst.app_slug === app.slug,
          );

          if (!installation) return null;

          // fetch repositories if selection is 'selected'
          // (the list endpoint doesn't include repositories)
          let repositories: string[] | null = null;
          if (installation.repository_selection === 'selected') {
            // detect token type
            const isPatToken = hasContextWithPatToken(null, context);
            const isAppToken = hasContextWithAppToken(null, context);

            // fail fast on unknown token type
            if (!isPatToken && !isAppToken) {
              throw new HelpfulError(
                'Unknown token type. Expected PAT (ghp_* or github_pat_*) or installation token (ghs_*).',
                { tokenPrefix: context.github.token.slice(0, 10) + '...' },
              );
            }

            // PAT: GET /user/installations/{id}/repositories
            if (isPatToken) {
              const reposResponse =
                await github.apps.listInstallationReposForAuthenticatedUser({
                  installation_id: installation.id,
                  per_page: 100,
                });
              repositories = reposResponse.data.repositories.map((r) => r.name);
            }

            // installation token: GET /installation/repositories
            if (isAppToken) {
              const reposResponse =
                await github.apps.listReposAccessibleToInstallation({
                  per_page: 100,
                });
              repositories = reposResponse.data.repositories.map((r) => r.name);
            }

            // fail fast if repositories weren't fetched
            if (repositories === null) {
              throw new UnexpectedCodePathError(
                'repositories not fetched for selected installation',
                { isPatToken, isAppToken, installation_id: installation.id },
              );
            }
          }

          return castToDeclaredGithubAppInstallation({
            installation,
            app,
            repositories,
          });
        }

        // for User targets, there's no PAT-accessible endpoint
        if (target.type === 'user') {
          throw new HelpfulError(
            'User installations are not supported. GitHub API has no PAT-accessible endpoint to read user installations.',
            { target },
          );
        }

        // for unsupported target.type, fail fast
        throw new UnexpectedCodePathError('unsupported target.type', { input });
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        if (error.message.includes('Not Found')) return null;
        throw new HelpfulError('github.getOneAppInstallation.byUnique error', {
          cause: error,
        });
      }
    }

    // no valid key provided
    UnexpectedCodePathError.throw('getOneAppInstallation requires by.unique', {
      input,
    });
  },
);
