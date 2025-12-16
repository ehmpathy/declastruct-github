import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrg } from '@src/domain.objects/DeclaredGithubOrg';

import { castToDeclaredGithubOrg } from './castToDeclaredGithubOrg';
import { getOneOrg } from './getOneOrg';

/**
 * .what = sets GitHub Organization profile settings
 * .why = enables declarative management of org profile
 *
 * AUTOMATION BOUNDARIES:
 * - AUTOMATED: Profile settings via PATCH /orgs/{org}
 * - NOTE: Cannot create organizations via API (only update existing)
 * - NOTE: Member privileges are managed via DeclaredGithubOrgMemberPrivileges
 */
export const setOrg = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubOrg;
      upsert: DeclaredGithubOrg;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrg>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // Check if org exists
    const before = await getOneOrg(
      { by: { unique: { login: desired.login } } },
      context,
    );

    // Cannot create orgs via API - must exist
    if (!before) {
      throw new HelpfulError(
        'GitHub Organization does not exist and cannot be created via API.\n' +
          'Organizations must be created manually via the GitHub UI.',
        {
          createUrl: 'https://github.com/organizations/plan',
          desiredOrg: desired,
        },
      );
    }

    // If findsert and found, return as-is (no changes)
    if (before && input.findsert) return before;

    // Apply profile updates via PATCH
    try {
      const response = await github.orgs.update({
        org: desired.login,
        name: desired.name ?? undefined,
        description: desired.description ?? undefined,
        billing_email: desired.billingEmail ?? undefined,
      });

      return castToDeclaredGithubOrg({ data: response.data });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.setOrg.update error', { cause: error });
    }
  },
);
