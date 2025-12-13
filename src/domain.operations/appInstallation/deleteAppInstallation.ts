import { asProcedure } from 'as-procedure';
import { HelpfulError } from 'helpful-errors';
import type { VisualogicContext } from 'visualogic';

import type { ContextGithubApi } from '../../domain.objects/ContextGithubApi';
import type { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';

/**
 * .what = deletes a GitHub App installation
 * .why = provides declarative interface with helpful error since deletion requires App JWT
 * .note = DELETE /app/installations/{id} requires App JWT which is out of scope; throws HelpfulError with uninstall URL
 */
export const deleteAppInstallation = asProcedure(
  async (
    input: {
      installation: DeclaredGithubAppInstallation;
    },
    _context: ContextGithubApi & VisualogicContext,
  ): Promise<never> => {
    const { installation } = input;

    // construct the uninstall URL based on target type
    const uninstallUrl =
      installation.target.type === 'organization'
        ? `https://github.com/organizations/${installation.target.slug}/settings/installations`
        : `https://github.com/settings/installations`;

    throw new HelpfulError(
      'GitHub App installations cannot be deleted via API with a user token. Please uninstall the app manually.',
      {
        uninstallUrl,
        instructions: [
          `1. Navigate to: ${uninstallUrl}`,
          `2. Find the installation for app "${installation.app.slug}"`,
          '3. Click "Configure" next to the installation',
          '4. Scroll to the "Danger zone" section',
          '5. Click "Uninstall" to remove the installation',
        ],
        note: 'Deletion via API requires an App JWT (authentication as the GitHub App itself), which is out of scope for this SDK.',
        installation,
      },
    );
  },
);
