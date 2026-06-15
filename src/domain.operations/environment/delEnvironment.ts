import { asProcedure } from 'as-procedure';
import { isRefByUnique, type Ref } from 'domain-objects';
import { HelpfulError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';
import type { ContextLogTrail } from 'sdk-logs';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import { DeclaredGithubEnvironment } from '@src/domain.objects/DeclaredGithubEnvironment';

/**
 * .what = extracts repo and environment name from environment ref
 * .why = validates and transforms generic ref to typed unique key
 */
const extractRepoAndNameFromRef = (input: {
  ref: Ref<typeof DeclaredGithubEnvironment> | undefined;
}): { repo: { owner: string; name: string }; name: string } => {
  if (!input.ref) {
    throw new UnexpectedCodePathError('no valid reference provided', {
      input,
    });
  }

  // must be a unique key ref (repo + name)
  if (!isRefByUnique({ of: DeclaredGithubEnvironment })(input.ref)) {
    throw new UnexpectedCodePathError(
      'delEnvironment requires unique key ref (repo + name)',
      { input },
    );
  }

  return input.ref as {
    repo: { owner: string; name: string };
    name: string;
  };
};

/**
 * .what = deletes a GitHub environment
 * .why = enables declarative management of deployment environments
 * .note = idempotent: no error if environment does not exist
 */
export const delEnvironment = asProcedure(
  async (
    input: {
      by: PickOne<{
        ref: Ref<typeof DeclaredGithubEnvironment>;
      }>;
    },
    context: ContextGithubApi & ContextLogTrail,
  ): Promise<void> => {
    // extract repo and name from ref
    const { repo, name } = extractRepoAndNameFromRef({ ref: input.by.ref });

    const github = getGithubClient({}, context);

    try {
      await github.repos.deleteAnEnvironment({
        owner: repo.owner,
        repo: repo.name,
        environment_name: name,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      // idempotent: no error if not found
      if (error.message.includes('Not Found')) return;
      throw new HelpfulError('github.deleteEnvironment error', {
        cause: error,
      });
    }
  },
);
