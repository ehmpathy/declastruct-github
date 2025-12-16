import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgVariable } from '@src/domain.objects/DeclaredGithubOrgVariable';

import { castToDeclaredGithubOrgVariable } from './castToDeclaredGithubOrgVariable';

/**
 * .what = gets a GitHub Organization variable
 * .why = retrieves current state for declarative management
 */
export const getOneOrgVariable = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubOrgVariable>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgVariable> | null> => {
    const github = getGithubClient({}, context);

    const { org, name } = (() => {
      if (input.by.unique)
        return { org: input.by.unique.org, name: input.by.unique.name };
      UnexpectedCodePathError.throw('not referenced by unique', { input });
    })();

    try {
      const response = await github.actions.getOrgVariable({
        org: org.login,
        name,
      });
      return castToDeclaredGithubOrgVariable({ data: response.data, org });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getOrgVariable error', { cause: error });
    }
  },
);
