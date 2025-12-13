import { getError, HelpfulError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { DeclaredGithubAppInstallation } from '../../domain.objects/DeclaredGithubAppInstallation';
import { DeclaredGithubOwner } from '../../domain.objects/DeclaredGithubOwner';
import { deleteAppInstallation } from './deleteAppInstallation';

const log = console;

describe('deleteAppInstallation', () => {
  const mockContext = {
    log,
    github: { token: 'test-token' },
  };

  given('an organization installation', () => {
    const owner = new DeclaredGithubOwner({
      type: 'organization',
      slug: 'ehmpathy',
    });
    const installation = new DeclaredGithubAppInstallation({
      app: { owner, slug: 'my-test-app' },
      target: owner,
      repositorySelection: 'all',
      repositories: null,
    });

    when('delete is called', () => {
      then('it should throw HelpfulError with org uninstall URL', async () => {
        const error = await getError(
          deleteAppInstallation({ installation }, mockContext as never),
        );

        expect(error).toBeInstanceOf(HelpfulError);
        expect(error.message).toContain('cannot be deleted via API');
        expect(error.message).toContain(
          'https://github.com/organizations/ehmpathy/settings/installations',
        );
        expect(error.message).toContain('my-test-app');
      });
    });
  });

  given('a user installation', () => {
    const owner = new DeclaredGithubOwner({ type: 'user', slug: 'someuser' });
    const installation = new DeclaredGithubAppInstallation({
      app: { owner, slug: 'user-app' },
      target: owner,
      repositorySelection: 'selected',
      repositories: ['my-repo'],
    });

    when('delete is called', () => {
      then('it should throw HelpfulError with user uninstall URL', async () => {
        const error = await getError(
          deleteAppInstallation({ installation }, mockContext as never),
        );

        expect(error).toBeInstanceOf(HelpfulError);
        expect(error.message).toContain('cannot be deleted via API');
        expect(error.message).toContain(
          'https://github.com/settings/installations',
        );
        expect(error.message).toContain('user-app');
      });
    });
  });
});
