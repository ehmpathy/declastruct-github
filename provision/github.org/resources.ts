import type { DeclastructProvider } from 'declastruct';
import { type DomainEntity, RefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import { genLogMethods } from 'sdk-logs';

import { getDeclastructGithubProvider } from '../../src/contract/sdks';
import { DeclaredGithubOrg } from '../../src/domain.objects/DeclaredGithubOrg';
import { DeclaredGithubOrgMemberPrivileges } from '../../src/domain.objects/DeclaredGithubOrgMemberPrivileges';
// todo: upgrade to github teams plan to get this (org rulesets need github team; free org 403s)
// import { DeclaredGithubOrgRuleset } from '../../src/domain.objects/DeclaredGithubOrgRuleset';
import { DeclaredGithubOrgSecret } from '../../src/domain.objects/DeclaredGithubOrgSecret';
import { DeclaredGithubOrgVariable } from '../../src/domain.objects/DeclaredGithubOrgVariable';
import { DeclaredGithubTeam } from '../../src/domain.objects/DeclaredGithubTeam';
import { DeclaredGithubTeamMembership } from '../../src/domain.objects/DeclaredGithubTeamMembership';

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
      log: genLogMethods(),
    },
  ),
];

export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // declare the org profile
  const org = DeclaredGithubOrg.as({
    login: 'ehmpathy',
    name: 'ehmpathy',
    description:
      'open source tools, made with empathy, for future travelers. move fast and build maintainable products in a pit of success. goal, no brains required.',
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
  const orgVariableDeclastructGithubTestauthAppId =
    DeclaredGithubOrgVariable.as({
      org: { login: 'ehmpathy' },
      name: 'DECLASTRUCT_GITHUB_TESTAUTH_APP_ID',
      value: '2465069',
      visibility: 'all',
    });
  const orgSecretDeclastructGithubTestauthAppPrivateKey =
    DeclaredGithubOrgSecret.as({
      org: { login: 'ehmpathy' },
      name: 'DECLASTRUCT_GITHUB_TESTAUTH_APP_PRIVATE_KEY',
      value: process.env.SECRET_DECLASTRUCT_GITHUB_TESTAUTH_APP_PRIVATE_KEY,
      visibility: 'all',
    });

  // declare github app variables for conformer app
  const orgVariableDeclastructGithubConformerAppId =
    DeclaredGithubOrgVariable.as({
      org: { login: 'ehmpathy' },
      name: 'DECLASTRUCT_GITHUB_CONFORMER_APP_ID',
      value: '2471935',
      visibility: 'all',
    });
  const orgSecretDeclastructGithubConformerAppPrivateKey =
    DeclaredGithubOrgSecret.as({
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

  // declare the releasers team
  const teamReleasers = DeclaredGithubTeam.as({
    org: { login: 'ehmpathy' },
    slug: 'releasers',
    name: 'releasers',
    description: 'folks able to release',
    privacy: 'closed',
    notifications: 'disabled',
    parent: null,
  });

  // declare team membership for releasers team
  const teamReleasersMembershipUladkasach = DeclaredGithubTeamMembership.as({
    team: { org: { login: 'ehmpathy' }, slug: 'releasers' },
    username: 'uladkasach',
    role: 'maintainer',
  });

  // todo: upgrade to github teams plan to get this
  // .why = org-level rulesets require the github team plan (or higher); the free ehmpathy org
  //        gets a 403 "Upgrade to GitHub Team to enable this feature" from GET /orgs/{org}/rulesets.
  //        the DeclaredGithubOrgRuleset code is correct + unit-verified; only the live dogfood is
  //        blocked by the org's plan tier. re-enable this block once ehmpathy is on github team.
  // .note = restrict who may cut `v*` version tags to the rhelease app only, org-wide;
  //         scoped to declastruct-github-demo + evaluate mode to prove the mechanism without
  //         org-wide blast radius; widen repositoryNameInclude to ~ALL and set enforcement
  //         to active once vetted (the ~ALL power stays deliberate, not defaulted on)
  // const orgRulesetVersionTags = DeclaredGithubOrgRuleset.as({
  //   org: { login: 'ehmpathy' },
  //   name: 'org-protect-version-tags',
  //   target: 'tag',
  //   enforcement: 'evaluate',
  //   bypassActors: [
  //     {
  //       actorId: 2472031, // rhelease github app id (gh api /apps/rhelease)
  //       actorType: 'Integration',
  //       bypassMode: 'always',
  //     },
  //   ],
  //   conditions: {
  //     refNameInclude: ['refs/tags/v*'],
  //     refNameExclude: [],
  //     repositoryNameInclude: ['declastruct-github-demo'],
  //     repositoryNameExclude: [],
  //     repositoryNameProtected: false,
  //   },
  //   rules: [{ type: 'creation' }],
  // });

  return [
    org,
    orgPrivs,
    orgVariableDeclastructGithubTestauthAppId,
    orgSecretDeclastructGithubTestauthAppPrivateKey,
    orgVariableDeclastructGithubConformerAppId,
    orgSecretDeclastructGithubConformerAppPrivateKey,
    orgVariableRheleaseAppId,
    orgSecretRheleaseAppPrivateKey,
    teamReleasers,
    teamReleasersMembershipUladkasach,
    // orgRulesetVersionTags, // todo: upgrade to github teams plan to get this
  ];
};
