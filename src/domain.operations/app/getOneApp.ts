import { Octokit } from '@octokit/rest';
import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import { hasContextWithAppToken } from '../context/hasContextWithAppToken';
import { hasContextWithPatToken } from '../context/hasContextWithPatToken';
import { castToDeclaredGithubApp } from './castToDeclaredGithubApp';

/**
 * .what = checks if a GitHub App is publicly accessible via unauthenticated request
 * .why = determines public status when API response doesn't include it
 */
const checkIfAppIsPublic = async (slug: string): Promise<boolean> => {
  const unauthenticatedClient = new Octokit();
  try {
    await unauthenticatedClient.apps.getBySlug({ app_slug: slug });
    return true; // accessible without auth = public
  } catch {
    return false; // not accessible without auth = private
  }
};

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

    // detect token type for inferring public field
    const isAppToken = hasContextWithAppToken(null, context);
    const isPat = hasContextWithPatToken(null, context);

    // execute the GitHub API call
    try {
      const response = await github.apps.getBySlug({ app_slug: slug });

      // infer public status based on token type
      // - app token: if we got a response, app must be public (private apps 404 for other apps' tokens)
      // - PAT: check via unauthenticated request (PAT can see private apps the user owns)
      const inferredPublic = await (async () => {
        if (isAppToken) return true;
        if (isPat) return checkIfAppIsPublic(slug);
        throw new UnexpectedCodePathError(
          'unsupported token type for inferring public status',
          { tokenPrefix: context.github.token.slice(0, 10) + '...' },
        );
      })();

      return castToDeclaredGithubApp(response.data, { inferredPublic });
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      // return null for 404/not found
      if (error.message.includes('Not Found')) return null;

      // throw helpful error for all other failures
      throw new HelpfulError('github.getOneApp error', { cause: error });
    }
  },
);
