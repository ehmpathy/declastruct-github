import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';

import { castToDeclaredGithubOrgSecret } from './castToDeclaredGithubOrgSecret';

/**
 * .what = gets a GitHub Organization secret (metadata only)
 * .why = retrieves current state for declarative management
 * .note = value is NEVER returned - secrets are write-only
 */
export const getOneOrgSecret = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubOrgSecret>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgSecret> | null> => {
    const github = getGithubClient({}, context);

    const { org, name } = (() => {
      if (input.by.unique)
        return { org: input.by.unique.org, name: input.by.unique.name };
      UnexpectedCodePathError.throw('not referenced by unique', { input });
    })();

    try {
      const response = await github.actions.getOrgSecret({
        org: org.login,
        secret_name: name,
      });
      return castToDeclaredGithubOrgSecret({ data: response.data, org });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getOrgSecret error', { cause: error });
    }
  },
);
