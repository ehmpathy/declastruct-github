import { asProcedure } from 'as-procedure';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubAppInstallation } from '@src/domain.objects/DeclaredGithubAppInstallation';

import { getOneAppInstallation } from './getOneAppInstallation';

/**
 * .what = sets a GitHub App installation: findsert or upsert
 * .why = provides declarative interface for managing installations with partial automation
 * .note = installations cannot be created via API; repository selection can be synced for existing installations
 */
export const setAppInstallation = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubAppInstallation;
      upsert: DeclaredGithubAppInstallation;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubAppInstallation>> => {
    const desired =
      input.findsert ??
      input.upsert ??
      UnexpectedCodePathError.throw(
        'no installation provided to setAppInstallation',
        { input },
      );

    // check whether it already exists
    const foundBefore = await getOneAppInstallation(
      {
        by: {
          unique: {
            app: desired.app,
            target: desired.target,
          },
        },
      },
      context,
    );

    // if installation doesn't exist, throw HelpfulError with installation instructions
    if (!foundBefore) {
      const installUrl = `https://github.com/apps/${desired.app.slug}/installations/new`;

      throw new HelpfulError(
        'GitHub App installations cannot be created via API. Please install the app manually.',
        {
          installUrl,
          instructions: [
            `1. Navigate to: ${installUrl}`,
            `2. Select the ${desired.target.type.toLowerCase()}: ${desired.target.slug}`,
            desired.repositorySelection === 'selected'
              ? `3. Choose "Only select repositories" and select: ${desired.repositories?.join(', ') ?? '(none specified)'}`
              : '3. Choose "All repositories" for full access',
            '4. Click "Install" to complete the installation',
          ],
          desired,
        },
      );
    }

    // if it's a findsert and exists, return the found installation
    if (input.findsert) return foundBefore;

    // if it's an upsert and exists, sync repository selection if needed
    if (input.upsert) {
      // check if we need to sync repository selection
      if (desired.repositorySelection === 'selected') {
        const result = await syncInstallationRepositories(
          {
            installationId: foundBefore.id,
            desiredRepositories: desired.repositories ?? [],
            currentRepositories: foundBefore.repositories ?? [],
            app: desired.app,
          },
          context,
        );

        // get updated installation after sync
        const foundAfter = await getOneAppInstallation(
          { by: { unique: { app: desired.app, target: desired.target } } },
          context,
        );
        if (!foundAfter)
          UnexpectedCodePathError.throw(
            'installation not found after sync. should not be possible',
            { desired, result },
          );
        return foundAfter;
      }

      // no sync needed, return as-is
      return foundBefore;
    }

    // unreachable
    UnexpectedCodePathError.throw(
      'unexpected code path in setAppInstallation',
      {
        input,
        foundBefore,
      },
    );
  },
);

/**
 * .what = syncs repositories for an installation by adding/removing as needed
 * .why = enables declarative management of which repos an installation has access to
 */
const syncInstallationRepositories = async (
  input: {
    installationId: number;
    desiredRepositories: string[];
    currentRepositories: string[];
    app: DeclaredGithubAppInstallation['app'];
  },
  context: ContextGithubApi & VisualogicContext,
): Promise<{ repositories: string[] }> => {
  const github = getGithubClient({}, context);

  // determine repos to add and remove
  const reposToAdd = input.desiredRepositories.filter(
    (repo) => !input.currentRepositories.includes(repo),
  );
  const reposToRemove = input.currentRepositories.filter(
    (repo) => !input.desiredRepositories.includes(repo),
  );

  // add repos that are missing
  for (const repoName of reposToAdd) {
    try {
      // first get the repo id
      const repoResponse = await github.repos.get({
        owner: input.app.owner.slug,
        repo: repoName,
      });
      const repoId = repoResponse.data.id;

      // then add it to the installation
      await github.apps.addRepoToInstallationForAuthenticatedUser({
        installation_id: input.installationId,
        repository_id: repoId,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError(
        `failed to add repository "${repoName}" to installation`,
        {
          cause: error,
          repoName,
          installationId: input.installationId,
        },
      );
    }
  }

  // remove repos that shouldn't be there
  for (const repoName of reposToRemove) {
    try {
      // first get the repo id
      const repoResponse = await github.repos.get({
        owner: input.app.owner.slug,
        repo: repoName,
      });
      const repoId = repoResponse.data.id;

      // then remove it from the installation
      await github.apps.removeRepoFromInstallationForAuthenticatedUser({
        installation_id: input.installationId,
        repository_id: repoId,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError(
        `failed to remove repository "${repoName}" from installation`,
        {
          cause: error,
          repoName,
          installationId: input.installationId,
        },
      );
    }
  }

  return { repositories: input.desiredRepositories };
};
