import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { ContextLogTrail } from 'sdk-logs';
import type { HasMetadata, PickOne } from 'type-fns';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';

import { getEnvironment } from './getEnvironment';
import { getTeamIdBySlug } from './getTeamIdBySlug';
import { getUserIdByUsername } from './getUserIdByUsername';
import { syncDeploymentBranchPolicies } from './syncDeploymentBranchPolicies';

type ReviewerRef = { type: 'User' | 'Team'; id: number };

/**
 * .what = transforms domain reviewers to API reviewer refs
 * .why = decouples reviewer lookup from main orchestration flow
 */
const lookupReviewerIds = async (
  input: {
    reviewers: DeclaredGithubEnvironment['reviewers'];
    org: string;
  },
  context: ContextGithubApi & ContextLogTrail,
): Promise<ReviewerRef[] | undefined> => {
  if (!input.reviewers) return undefined;

  const results: ReviewerRef[] = [];

  // lookup user IDs
  if (input.reviewers.users) {
    for (const username of input.reviewers.users) {
      const id = await getUserIdByUsername({ username }, context);
      results.push({ type: 'User', id });
    }
  }

  // lookup team IDs
  if (input.reviewers.teams) {
    for (const slug of input.reviewers.teams) {
      const id = await getTeamIdBySlug({ org: input.org, slug }, context);
      results.push({ type: 'Team', id });
    }
  }

  return results.length > 0 ? results : undefined;
};

/**
 * .what = transforms domain branch policy to API format
 * .why = decouples API shape transformation from orchestration
 */
const asDeploymentBranchPolicyConfig = (input: {
  deploymentBranchPolicy: DeclaredGithubEnvironment['deploymentBranchPolicy'];
}): { protected_branches: boolean; custom_branch_policies: boolean } | null => {
  if (!input.deploymentBranchPolicy) return null;

  if ('protectedBranches' in input.deploymentBranchPolicy) {
    return {
      protected_branches: true,
      custom_branch_policies: false,
    };
  }

  if ('customBranches' in input.deploymentBranchPolicy) {
    return {
      protected_branches: false,
      custom_branch_policies: true,
    };
  }

  return null;
};

/**
 * .what = sets a GitHub environment
 * .why = enables declarative management of deployment environments
 * .note = atomic: if branch pattern sync fails, environment is rolled back
 */
export const setEnvironment = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubEnvironment;
      upsert: DeclaredGithubEnvironment;
    }>,
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<HasMetadata<DeclaredGithubEnvironment>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // check if environment exists
    const before = await getEnvironment(
      { by: { unique: { repo: desired.repo, name: desired.name } } },
      context,
    );

    // if findsert and found, return as-is
    if (before && input.findsert) return before;

    // transform reviewers to API format
    const reviewers = await lookupReviewerIds(
      { reviewers: desired.reviewers, org: desired.repo.owner },
      context,
    );

    // transform branch policy to API format
    const deploymentBranchPolicy = asDeploymentBranchPolicyConfig({
      deploymentBranchPolicy: desired.deploymentBranchPolicy,
    });

    // track if we created the environment (for rollback)
    const wasCreated = !before;

    try {
      // create or update environment
      // note: prevent_self_review requires at least one reviewer per GitHub API
      // omit the field entirely when no reviewers to avoid API rejection
      const hasReviewers = reviewers && reviewers.length > 0;
      await github.repos.createOrUpdateEnvironment({
        owner: desired.repo.owner,
        repo: desired.repo.name,
        environment_name: desired.name,
        wait_timer: desired.waitTimer ?? undefined,
        prevent_self_review: hasReviewers
          ? desired.preventSelfReview
          : undefined,
        reviewers,
        deployment_branch_policy: deploymentBranchPolicy,
      });

      // sync custom branch patterns if needed
      if (
        desired.deploymentBranchPolicy &&
        'customBranches' in desired.deploymentBranchPolicy
      ) {
        await syncDeploymentBranchPolicies(
          {
            owner: desired.repo.owner,
            repo: desired.repo.name,
            environmentName: desired.name,
            desiredPatterns: desired.deploymentBranchPolicy.customBranches,
          },
          context,
        );
      }

      // fetch and return the updated environment
      const after = await getEnvironment(
        { by: { unique: { repo: desired.repo, name: desired.name } } },
        context,
      );
      if (!after) {
        throw new HelpfulError('environment not found after set', {
          desired,
        });
      }
      return after;
    } catch (error) {
      // rollback: delete environment if we created it and sync failed
      if (wasCreated) {
        try {
          await github.repos.deleteAnEnvironment({
            owner: desired.repo.owner,
            repo: desired.repo.name,
            environment_name: desired.name,
          });
        } catch (rollbackError) {
          // log rollback failure but don't mask original error
          context.log.warn('rollback failed: could not delete environment', {
            environment: desired.name,
            repo: `${desired.repo.owner}/${desired.repo.name}`,
            rollbackError:
              rollbackError instanceof Error
                ? rollbackError.message
                : String(rollbackError),
          });
        }
      }
      throw error;
    }
  },
);
