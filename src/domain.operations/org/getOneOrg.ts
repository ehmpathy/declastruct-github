import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';

import { castToDeclaredGithubOrg } from './castToDeclaredGithubOrg';

/**
 * .what = gets a GitHub Organization's settings
 * .why = retrieves current state of org for declarative management
 */
export const getOneOrg = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubOrg>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrg> | null> => {
    const github = getGithubClient({}, context);

    const login = (() => {
      if (input.by.unique) return input.by.unique.login;
      UnexpectedCodePathError.throw('not referenced by unique', { input });
    })();

    try {
      const response = await github.orgs.get({ org: login });
      return castToDeclaredGithubOrg({ data: response.data });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getOrg error', { cause: error });
    }
  },
);
