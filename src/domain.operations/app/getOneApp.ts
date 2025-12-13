import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import { castToDeclaredGithubApp } from './castToDeclaredGithubApp';

/**
 * .what = gets a GitHub App by unique key
 * .why = retrieves current state of an app from GitHub API for declarative management
 * .note = by.primary not supported - GitHub API requires app slug or JWT auth to lookup apps
 */
export const getOneApp = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubApp>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubApp> | null> => {
    // get cached GitHub client
    const github = getGithubClient({}, context);

    // determine app slug from input
    if (!input.by.unique)
      UnexpectedCodePathError.throw('not referenced by unique. how not?', {
        input,
      });
    const { slug } = input.by.unique;

    // execute the GitHub API call
    try {
      const response = await github.apps.getBySlug({ app_slug: slug });
      return castToDeclaredGithubApp(response.data);
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      // return null for 404/not found
      if (error.message.includes('Not Found')) return null;

      // throw helpful error for all other failures
      throw new HelpfulError('github.getOneApp error', { cause: error });
    }
  },
);
