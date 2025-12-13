import { asProcedure } from 'as-procedure';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubApp } from '../../domain.objects/DeclaredGithubApp';
import { getOneApp } from './getOneApp';

/**
 * .what = sets a GitHub App: finsert or upsert
 * .why = provides declarative interface with helpful errors since apps cannot be created/updated via API
 * .note = GitHub Apps must be created via web UI or manifest flow; this function throws HelpfulError with actionable URLs
 */
export const setApp = asProcedure(
  async (
    input: PickOne<{
      finsert: DeclaredGithubApp;
      upsert: DeclaredGithubApp;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubApp>> => {
    const desired =
      input.finsert ??
      input.upsert ??
      UnexpectedCodePathError.throw('no app provided to setApp', { input });

    // validate that name will cast to expected slug
    // (GitHub auto-generates slug from name during registration)
    const name = desired.name ?? desired.slug;
    const expectedSlug = castNameToSlug(name);
    if (expectedSlug !== desired.slug)
      throw new HelpfulError(
        `App name "${name}" will generate slug "${expectedSlug}", but expected slug "${desired.slug}".`,
        {
          suggestion: `Either change the name to "${desired.slug}" or change the slug to "${expectedSlug}"`,
          name,
          expectedSlug,
          desiredSlug: desired.slug,
        },
      );

    // check whether it already exists
    const foundBefore = await getOneApp(
      {
        by: {
          unique: {
            owner: desired.owner,
            slug: desired.slug,
          },
        },
      },
      context,
    );

    // if it's a finsert and exists, return the found app
    if (foundBefore && input.finsert) return foundBefore;

    // if it's an upsert and exists, throw HelpfulError with settings URL
    if (foundBefore && input.upsert) {
      const settingsUrl =
        desired.owner.type === 'organization'
          ? `https://github.com/organizations/${desired.owner.slug}/settings/apps/${desired.slug}`
          : `https://github.com/settings/apps/${desired.slug}`;
      throw new HelpfulError(
        'GitHub Apps cannot be updated via API. Please update the app settings manually.',
        {
          url: settingsUrl,
          instructions: [
            'Navigate to the settings URL above',
            'Update the app permissions, events, or other settings (See the plan diff for which changes to make)',
            'Save your changes',
          ],
        },
      );
    }

    // app doesn't exist - provide manual creation instructions
    const registrationUrl =
      desired.owner.type === 'organization'
        ? `https://github.com/organizations/${desired.owner.slug}/settings/apps/new`
        : `https://github.com/settings/apps/new`;

    throw new HelpfulError(
      'GitHub Apps cannot be created via API. Please create the app manually.',
      {
        registrationUrl,
        instructions: [
          `1. Navigate to: ${registrationUrl}`,
          `2. Set the app name to: "${desired.name ?? desired.slug}"`,
          '3. Configure permissions and events as shown in the manifest below',
          '4. Save and generate a private key',
        ],
        desired,
      },
    );
  },
);

/**
 * .what = casts an app name to the slug GitHub will generate
 * .why = GitHub auto-generates slugs from names during app registration
 * .how = lowercase, replace non-alphanumeric with hyphens, collapse consecutive hyphens, trim hyphens
 */
const castNameToSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric sequences with single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
