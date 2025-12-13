import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';
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
            const reposResponse =
              await github.apps.listInstallationReposForAuthenticatedUser({
                installation_id: installation.id,
                per_page: 100,
              });
            repositories = reposResponse.data.repositories.map((r) => r.name);
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
        throw new UnexpectedCodePathError('unsupported target.type', { input })
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
