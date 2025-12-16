import { DeclastructProvider, del } from 'declastruct';
import { getDeclastructGithubProvider } from '../../src/contract/sdks';
import { DomainEntity, RefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import { DeclaredGithubOrgVariable } from '../../src/domain.objects/DeclaredGithubOrgVariable';
import { DeclaredGithubOrgSecret } from '../../src/domain.objects/DeclaredGithubOrgSecret';
import { DeclaredGithubOrgMemberPrivileges } from '../../src/domain.objects/DeclaredGithubOrgMemberPrivileges';
import { DeclaredGithubOrg } from '../../src/domain.objects/DeclaredGithubOrg';

export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getDeclastructGithubProvider(
    {
      credentials: {
        token:
          process.env.GITHUB_TOKEN ??
          UnexpectedCodePathError.throw('github token not supplied'),
      },
    },
    {
      log: {
        info: () => { },
        debug: () => { },
        warn: console.warn,
        error: console.error,
      },
    },
  ),
];

export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // declare the org profile
  const org = DeclaredGithubOrg.as({
    login: 'ehmpathy',
    name: 'ehmpathy',
    description: 'open source tools, made with empathy, for future travelers. move fast and build maintainable products in a pit of success. goal, no brains required.',
  });

  // declare org member privileges (KEY SECURITY SETTINGS)
  const orgPrivs = DeclaredGithubOrgMemberPrivileges.as({
    org: RefByUnique.as<typeof DeclaredGithubOrg>(org),

    // nuclear options disabled
    membersCanDeleteRepositories: false, // !: crucial: only owners can delete
    membersCanChangeRepoVisibility: false, // !: crucial: only owners can change visibility

    // repository creation enabled
    membersCanCreateRepositories: true,
    membersCanCreatePublicRepositories: true,
    membersCanCreatePrivateRepositories: true,
    membersCanCreateInternalRepositories: null, // not enterprise
    membersCanForkPrivateRepositories: false, // no forks, only branches

    // collaboration
    membersCanInviteOutsideCollaborators: true,

    // pages
    membersCanCreatePages: true,
    membersCanCreatePublicPages: true,
    membersCanCreatePrivatePages: true,

    // other
    defaultRepositoryPermission: 'write',
  });

  // declare github app variables for testauth app
  const orgVariableDeclastructGithubTestauthAppId = DeclaredGithubOrgVariable.as({
    org: { login: 'ehmpathy' },
    name: 'DECLASTRUCT_GITHUB_TESTAUTH_APP_ID',
    value: '2465069',
    visibility: 'all',
  });
  const orgSecretDeclastructGithubTestauthAppPrivateKey = DeclaredGithubOrgSecret.as({
    org: { login: 'ehmpathy' },
    name: 'DECLASTRUCT_GITHUB_TESTAUTH_APP_PRIVATE_KEY',
    value: process.env.SECRET_DECLASTRUCT_GITHUB_TESTAUTH_APP_PRIVATE_KEY,
    visibility: 'all',
  });

  // declare github app variables for conformer app
  const orgVariableDeclastructGithubConformerAppId = DeclaredGithubOrgVariable.as({
    org: { login: 'ehmpathy' },
    name: 'DECLASTRUCT_GITHUB_CONFORMER_APP_ID',
    value: '2471935',
    visibility: 'all',
  });
  const orgSecretDeclastructGithubConformerAppPrivateKey = DeclaredGithubOrgSecret.as({
    org: { login: 'ehmpathy' },
    name: 'DECLASTRUCT_GITHUB_CONFORMER_APP_PRIVATE_KEY',
    value: process.env.SECRET_DECLASTRUCT_GITHUB_CONFORMER_APP_PRIVATE_KEY,
    visibility: 'all',
  });

  // declare github app variables for rhelease app
  const orgVariableRheleaseAppId = DeclaredGithubOrgVariable.as({
    org: { login: 'ehmpathy' },
    name: 'RHELEASE_APP_ID',
    value: '2472031',
    visibility: 'all',
  });
  const orgSecretRheleaseAppPrivateKey = DeclaredGithubOrgSecret.as({
    org: { login: 'ehmpathy' },
    name: 'RHELEASE_APP_PRIVATE_KEY',
    value: process.env.SECRET_RHELEASE_APP_PRIVATE_KEY,
    visibility: 'all',
  });

  return [
    org,
    orgPrivs,
    orgVariableDeclastructGithubTestauthAppId,
    orgSecretDeclastructGithubTestauthAppPrivateKey,
    orgVariableDeclastructGithubConformerAppId,
    orgSecretDeclastructGithubConformerAppPrivateKey,
    orgVariableRheleaseAppId,
    orgSecretRheleaseAppPrivateKey,
  ];
};
