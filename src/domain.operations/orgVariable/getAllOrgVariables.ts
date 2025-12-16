import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';
import type { DeclaredGithubOrgVariable } from '@src/domain.objects/DeclaredGithubOrgVariable';

import { castToDeclaredGithubOrgVariable } from './castToDeclaredGithubOrgVariable';

/**
 * .what = gets all GitHub Organization variables
 * .why = retrieves current state for declarative management
 */
export const getAllOrgVariables = asProcedure(
  async (
    input: { org: RefByUnique<typeof DeclaredGithubOrg> },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgVariable>[]> => {
    const github = getGithubClient({}, context);

    try {
      const response = await github.actions.listOrgVariables({
        org: input.org.login,
      });
      return response.data.variables.map((v) =>
        castToDeclaredGithubOrgVariable({ data: v, org: input.org }),
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.getAllOrgVariables error', {
        cause: error,
      });
    }
  },
);
