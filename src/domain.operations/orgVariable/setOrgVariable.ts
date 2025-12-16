import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgVariable } from '@src/domain.objects/DeclaredGithubOrgVariable';
import { getRepo } from '@src/domain.operations/repo/getRepo';

import { getOneOrgVariable } from './getOneOrgVariable';

/**
 * .what = sets a GitHub Organization variable
 * .why = enables declarative management of org-level variables
 */
export const setOrgVariable = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubOrgVariable;
      upsert: DeclaredGithubOrgVariable;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgVariable>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // Check if variable exists
    const before = await getOneOrgVariable(
      { by: { unique: { org: desired.org, name: desired.name } } },
      context,
    );

    // Resolve repo IDs if visibility is 'selected'
    const selectedRepositoryIds =
      desired.visibility === 'selected' && desired.selectedRepositoryNames
        ? await Promise.all(
            desired.selectedRepositoryNames.map(async (name) => {
              const repo = await getRepo(
                { by: { unique: { owner: desired.org.login, name } } },
                context,
              );
              if (!repo)
                throw new HelpfulError(
                  `Repository not found: ${desired.org.login}/${name}`,
                );
              return repo.id!;
            }),
          )
        : undefined;

    // If findsert and found, return as-is
    if (before && input.findsert) return before;

    // If exists, update
    if (before && input.upsert) {
      try {
        await github.actions.updateOrgVariable({
          org: desired.org.login,
          name: desired.name,
          value: desired.value,
          visibility: desired.visibility,
          selected_repository_ids: selectedRepositoryIds,
        });

        return (await getOneOrgVariable(
          { by: { unique: { org: desired.org, name: desired.name } } },
          context,
        ))!;
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        throw new HelpfulError('github.setOrgVariable.update error', {
          cause: error,
        });
      }
    }

    // Create new variable
    try {
      await github.actions.createOrgVariable({
        org: desired.org.login,
        name: desired.name,
        value: desired.value,
        visibility: desired.visibility,
        selected_repository_ids: selectedRepositoryIds,
      });

      return (await getOneOrgVariable(
        { by: { unique: { org: desired.org, name: desired.name } } },
        context,
      ))!;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.setOrgVariable.create error', {
        cause: error,
      });
    }
  },
);
