import { asProcedure } from 'as-procedure';
import {
  isRefByUnique,
  type Ref,
  type RefByPrimary,
  type RefByUnique,
} from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';

import { castToDeclaredGithubEnvironment } from './castToDeclaredGithubEnvironment';

/**
 * .what = gets a GitHub environment
 * .why = retrieves current state for declarative management
 */
export const getEnvironment = asProcedure(
  async (
    input: {
      by: PickOne<{
        unique: RefByUnique<typeof DeclaredGithubEnvironment>;
        primary: RefByPrimary<typeof DeclaredGithubEnvironment>;
        ref: Ref<typeof DeclaredGithubEnvironment>;
      }>;
    },
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubEnvironment> | null> => {
    // handle by.ref dispatch
    if (input.by.ref) {
      if (isRefByUnique({ of: DeclaredGithubEnvironment })(input.by.ref)) {
        return getEnvironment(
          {
            by: {
              unique: input.by.ref as RefByUnique<
                typeof DeclaredGithubEnvironment
              >,
            },
          },
          context,
        );
      }
      return getEnvironment(
        {
          by: {
            primary: input.by.ref as RefByPrimary<
              typeof DeclaredGithubEnvironment
            >,
          },
        },
        context,
      );
    }

    // handle by.primary
    if (input.by.primary) {
      // note: GitHub API does not support lookup by ID, so we cannot implement this
      throw new UnexpectedCodePathError(
        'getEnvironment by.primary not supported - GitHub API requires environment name',
        { input },
      );
    }

    // handle by.unique
    if (!input.by.unique) {
      throw new UnexpectedCodePathError('no valid reference provided', {
        input,
      });
    }

    const { repo, name } = input.by.unique;
    const github = getGithubClient({}, context);

    try {
      const response = await github.repos.getEnvironment({
        owner: repo.owner,
        repo: repo.name,
        environment_name: name,
      });

      // fetch branch policies if custom branch policies are enabled
      let branchPolicies = null;
      if (response.data.deployment_branch_policy?.custom_branch_policies) {
        const policiesResponse =
          await github.repos.listDeploymentBranchPolicies({
            owner: repo.owner,
            repo: repo.name,
            environment_name: name,
          });
        branchPolicies = policiesResponse.data;
      }

      return castToDeclaredGithubEnvironment({
        data: response.data,
        branchPolicies,
        repo,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('Not Found')) return null;
      throw new HelpfulError('github.getEnvironment error', { cause: error });
    }
  },
);
