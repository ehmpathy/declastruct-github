# declastruct-github

![test](https://github.com/ehmpathy/declastruct-github/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/declastruct-github/workflows/publish/badge.svg)

Declarative control of Github constructs, via [declastruct](https://github.com/ehmpathy/declastruct).

Declare the structures you want. Plan to see the changes required. Apply to make it so 🪄


# install

```sh
npm install -s declastruct-github
```

# use via cli

## example.1

### wish ✨

declare the resources you wish to have - and what state you wish them to be in

```ts
export const getProvider = async () => DeclastructGithubProvider.as({
  credentials: {
    token: process.env.GITHUB_TOKEN,
  }
})

export const getResources = async () => {
  const repo = DeclaredGithubRepo.as({
    name: 'super repo',
  });
  const repoConfig = DeclaredGithubRepoConfig.as({
    repo: refByUnique(repo),

    // for example, only allow squash merges
    allowSquashMerge: true,
    allowMergeCommit: false,
    allowRebaseMerge: false,

    // ... see the docs or types for other options
  });

  // ... add whatever resources you wish

  return [
    repo,
    repoConfig,
    // ... all the resources you wish for will go here
  ],
}
```

### plan 🔮

plan how to achieve the wish of resources you've declared

this will emit a plan that declares the changes required in order to fulfill the wish

```sh
npx declastruct plan --wish provision/github/resources.ts --output provision/github/.temp/plan.json
```

### apply 🪄

apply the plan to fulfill the wish

this will apply only the changes declared in the plan - and only if this plan is still applicable

```sh
npx declastruct apply --plan provision/github/.temp/plan.json
```


## example.2

```ts
export const getResources = async () => {
  // declare the repo
  const repo = DeclaredGithubRepo.as({
    name: "your repo",
  });

  // declare the main branch
  const branchMain = DeclaredGithubBranch.as({
    repo: refByUnique(repo),
    name: 'main',
  })

  // declare config for the repo
  const repoConfig = DeclaredGithubRepoConfig.as({
    // explicitly set the main branch
    defaultBranch: refByUnique(branchMain),

    // we only use issues; the rest is noise today
    hasIssues: true,
    hasProjects: false,
    hasWiki: false,
    hasDownloads: false,
    isTemplate: false,

    // only squash merges are allowed
    allowSquashMerge: true,
    allowMergeCommit: false, // but especially not merge merges. never merge merges
    allowRebaseMerge: false,

    // always cleanup after yourself
    deleteBranchOnMerge: true,
  });

  // declare protection for that branch, too
  const branchMainProtection = DeclaredGithubBranchProtection.as({
    branch: refByUnique(branchMain),

    enforceAdmins: true, // yes, even admins need to follow this (note: they can still take the time to go and change the settings temporarily for the exceptions)
    allowsDeletions: false, // dont allow the `main` branch to be deleted
    allowsForcePushes: false, // dont allow `main` branch to be force pushed to
    requireLinearHistory: false, //  # no ugly merge commits, woo! 🎉

    requiedStatusChecks: {
      strict: true, // branch must be up to date. otherwise, we dont know if it will really pass once it is merged
      contexts = [
        "suite / install / npm",
        "suite / test-commits",
        "suite / test-types",
        "suite / test-format",
        "suite / test-lint",
        "suite / test-unit",
        "suite / test-integration",
        "suite / test-acceptance-locally",
        "pullreq-title" // "review / pullreq-title",
      ]
    }
  })


  return [
    repo,
    branchMain,
    repoConfig,
    branchMainProtection,
  ]
}
```

# use imperatively

## resource=DeclaredGithubRepo

### getRepos

### getRepo

### setRepo

## resource=DeclaredGithubBranch

### getBranches

### getBranch

### setBranch

## resource=DeclaredGithubRepoConfig

### getRepoConfig

### setRepoConfig

## resource=DeclaredGithubBranchProtection

### getBranchProtection

### setBranchProtection
