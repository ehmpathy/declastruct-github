import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '../../domain.objects/DeclaredGithubOrg';
import type { DeclaredGithubOrgSecret } from '../../domain.objects/DeclaredGithubOrgSecret';
import { castToDeclaredGithubOrgSecret } from './castToDeclaredGithubOrgSecret';

/**
 * .what = gets all GitHub Organization secrets (metadata only)
 * .why = retrieves current state for declarative management
 * .note = values are NEVER returned - secrets are write-only
 */
export const getAllOrgSecrets = asProcedure(
  async (
    input: { org: RefByUnique<typeof DeclaredGithubOrg> },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgSecret>[]> => {
    const github = getGithubClient({}, context);

    try {
      const response = await github.actions.listOrgSecrets({
        org: input.org.login,
      });
      return response.data.secrets.map((s) =>
        castToDeclaredGithubOrgSecret({ data: s, org: input.org }),
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.getAllOrgSecrets error', { cause: error });
    }
  },
);
