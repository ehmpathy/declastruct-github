import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { HasMetadata, PickOne } from 'type-fns';
import type { VisualogicContext } from 'visualogic';

import { getGithubClient } from '@src/access/sdks/getGithubClient';
import type { ContextGithubApi } from '@src/domain.objects/ContextGithubApi';
import type { DeclaredGithubOrgSecret } from '@src/domain.objects/DeclaredGithubOrgSecret';
import { getRepo } from '@src/domain.operations/repo/getRepo';

import { getOneOrgSecret } from './getOneOrgSecret';

/**
 * .what = encrypts a secret value using the org's public key
 * .why = GitHub requires secrets to be encrypted before sending
 * .note = uses dynamic import to avoid module init issues in test environments
 */
const encryptSecret = async (input: {
  value: string;
  publicKey: string;
}): Promise<string> => {
  // dynamic import to avoid libsodium init issues at module load time
  const sodium = await import('libsodium-wrappers').then((m) => m.default);
  await sodium.ready;
  const binKey = sodium.from_base64(
    input.publicKey,
    sodium.base64_variants.ORIGINAL,
  );
  const binSec = sodium.from_string(input.value);
  const encBytes = sodium.crypto_box_seal(binSec, binKey);
  return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
};

/**
 * .what = sets a GitHub Organization secret
 * .why = enables declarative management of org-level secrets
 *
 * WRITE-ONLY PATTERN:
 * - If value is undefined and secret exists: keeps existing value (no-op)
 * - If value is undefined and secret doesn't exist: throws error (must provide value)
 * - If value is provided: encrypts and creates/updates secret
 */
export const setOrgSecret = asProcedure(
  async (
    input: PickOne<{
      findsert: DeclaredGithubOrgSecret;
      upsert: DeclaredGithubOrgSecret;
    }>,
    context: ContextGithubApi & VisualogicContext,
  ): Promise<HasMetadata<DeclaredGithubOrgSecret>> => {
    const desired = input.findsert ?? input.upsert;
    const github = getGithubClient({}, context);

    // Check if secret exists (metadata only)
    const before = await getOneOrgSecret(
      { by: { unique: { org: desired.org, name: desired.name } } },
      context,
    );

    // If findsert and found, return as-is (no changes needed)
    if (before && input.findsert) return before;

    // If no value provided and secret doesn't exist, error
    if (!desired.value && !before) {
      throw new HelpfulError(
        'Cannot create secret without a value. ' +
          'Provide the secret value via process.env or directly.',
        { desiredSecret: desired },
      );
    }

    // If no value provided and secret exists, check if we can skip the update
    // NOTE: GitHub API requires encrypted_value for PUT, so we cannot update
    // visibility without re-providing the value.
    if (!desired.value && before) {
      const visibilityChanged = desired.visibility !== before.visibility;
      const selectedReposChanged =
        desired.visibility === 'selected' &&
        JSON.stringify(desired.selectedRepositoryNames?.sort()) !==
          JSON.stringify(before.selectedRepositoryNames?.sort());

      if (visibilityChanged || selectedReposChanged) {
        throw new HelpfulError(
          'Cannot update secret visibility without re-providing the secret value. ' +
            'GitHub API requires the encrypted value for any secret update.',
          {
            desiredSecret: desired,
            currentVisibility: before.visibility,
            desiredVisibility: desired.visibility,
          },
        );
      }

      // No changes needed, return existing metadata
      return before;
    }

    // Get org's public key for encryption
    const keyResponse = await github.actions.getOrgPublicKey({
      org: desired.org.login,
    });

    // Encrypt the secret value
    const encryptedValue = await encryptSecret({
      value: desired.value!,
      publicKey: keyResponse.data.key,
    });

    // Resolve repo IDs if visibility is 'selected'
    const selectedRepositoryIds =
      desired.visibility === 'selected' && desired.selectedRepositoryNames
        ? await Promise.all(
            desired.selectedRepositoryNames.map(async (name) => {
              const repo = await getRepo(
                { by: { unique: { owner: desired.org.login, name } } },
                context,
              );
              if (!repo)
                throw new HelpfulError(
                  `Repository not found: ${desired.org.login}/${name}`,
                );
              return repo.id!;
            }),
          )
        : undefined;

    // Create or update secret
    try {
      await github.actions.createOrUpdateOrgSecret({
        org: desired.org.login,
        secret_name: desired.name,
        encrypted_value: encryptedValue,
        key_id: keyResponse.data.key_id,
        visibility: desired.visibility,
        selected_repository_ids: selectedRepositoryIds,
      });

      return (await getOneOrgSecret(
        { by: { unique: { org: desired.org, name: desired.name } } },
        context,
      ))!;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new HelpfulError('github.setOrgSecret error', { cause: error });
    }
  },
);
