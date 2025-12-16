import { asProcedure } from 'as-procedure';
import type { RefByUnique } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '../../access/sdks/getGithubClient';
import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgMemberPrivileges } from '../../domain.objects/DeclaredGithubOrgMemberPrivileges';
import { castToDeclaredGithubOrgMemberPrivileges } from './castToDeclaredGithubOrgMemberPrivileges';

/**
 * .what = gets GitHub Organization member privileges
 * .why = retrieves current security settings for declarative management
 */
export const getOneOrgMemberPrivileges = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubOrgMemberPrivileges>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgMemberPrivileges> | null> => {
    const github = getGithubClient({}, context);

    const org = (() => {
      if (input.by.unique) return input.by.unique.org;
      UnexpectedCodePathError.throw('not referenced by unique', { input });
    })();

    try {
      const response = await github.orgs.get({ org: org.login });
      return castToDeclaredGithubOrgMemberPrivileges({
        data: response.data,
        org,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getOrgMemberPrivileges error', {
        cause: error,
      });
    }
  },
);
