import { asProcedure } from 'as-procedure';
import type { Ref } from 'domain-objects';
import { HelpfulError } from 'helpful-errors';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';

/**
 * .what = deletes a GitHub Organization secret
 * .why = enables declarative management of org-level secrets
 */
export const delOrgSecret = asProcedure(
  async (
    input: { secret: Ref<typeof DeclaredGithubOrgSecret> },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<void> => {
    const github = getGithubClient({}, context);

    // extract unique key fields
    const secret = input.secret as { org: { login: string }; name: string };

    try {
      await github.actions.deleteOrgSecret({
        org: secret.org.login,
        secret_name: secret.name,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.delOrgSecret error', { cause: error });
    }
  },
);
