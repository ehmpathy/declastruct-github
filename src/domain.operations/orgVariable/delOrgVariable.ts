import { asProcedure } from 'as-procedure';
import type { Ref } from 'domain-objects';
import { HelpfulError } from 'helpful-errors';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgVariable } from '../../domain.objects/DeclaredGithubOrgVariable';

/**
 * .what = deletes a GitHub Organization variable
 * .why = enables declarative management of org-level variables
 */
export const delOrgVariable = asProcedure(
  async (
    input: { variable: Ref<typeof DeclaredGithubOrgVariable> },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<void> => {
    const github = getGithubClient({}, context);

    // extract unique key fields
    const variable = input.variable as { org: { login: string }; name: string };

    try {
      await github.actions.deleteOrgVariable({
        org: variable.org.login,
        name: variable.name,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.delOrgVariable error', { cause: error });
    }
  },
);
