import { execSync } from 'child_process';
import type { DeclastructChange } from 'declastruct';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getDeclastructGithubProvider } from '@src/domain.operations/provider/getDeclastructGithubProvider';

const log = console;

/**
 * .what = normalizes CLI stdout for snapshot comparison
 * .why = strips variable content (timestamps, paths, durations, spinner animation)
 */
const normalizeCliStdoutForSnapshot = (input: { stdout: string }): string => {
  return (
    input.stdout
      // strip timestamps and paths
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<timestamp>')
      .replace(/\/[^\s]+\.json/g, '<path>.json')
      .replace(/\/[^\s]+\.ts/g, '<path>.ts')
      .replace(/\d+ms/g, '<duration>ms')
      .replace(/done in \d+\.\d+s/g, 'done in <time>s')
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC strip for terminal output
      .replace(/\x1b/g, '')
      .replace(/\[A/g, '')
      .split('\n')
      .filter((line) => {
        if (line.includes('inflight')) return false;
        if (line.includes('[K') && !line.includes('done in')) return false;
        return true;
      })
      .map((line) => line.replace(/^\[K/, '').trimEnd())
      .join('\n')
  );
};

/**
 * .what = normalizes error output for snapshot comparison
 * .why = strips variable content (ESC chars, repo paths, version numbers, timestamps)
 */
const normalizeErrorOutputForSnapshot = (input: {
  errorOutput: string;
}): string => {
  return (
    input.errorOutput
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC strip for terminal output
      .replace(/\x1b/g, '')
      // strip timestamps in filenames
      .replace(
        /run\.\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        'run.<timestamp>',
      )
      // strip repo base paths
      .replace(/\/home\/[^/]+\/[^/]+\/[^/]+\/_worktrees\/[^/]+\//g, '<repo>/')
      .replace(/\/home\/runner\/work\/[^/]+\/[^/]+\//g, '<repo>/')
      // strip pnpm version numbers
      .replace(
        /declastruct@[\d.]+_domain-objects@[\d.]+/g,
        'declastruct@<version>',
      )
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
  );
};

/**
 * .what = acceptance tests for declastruct CLI workflow
 * .why = validates end-to-end usage of declastruct-github with declastruct CLI
 */
describe('declastruct CLI workflow', () => {
  const githubContext = getSampleGithubContext();

  given('a declastruct resources file', () => {
    const testDir = join(
      __dirname,
      '.test',
      '.temp',
      'acceptance',
      `run.${new Date().toISOString()}`,
    );
    const resourcesFile = join(
      __dirname,
      '.test',
      'assets',
      'resources.acceptance.ts',
    );
    const planFile = join(testDir, 'plan.json');

    beforeEach(() => {
      // ensure clean test directory
      mkdirSync(testDir, { recursive: true });
    });

    when('[t0] plan is created via declastruct CLI', () => {
      /**
       * .what = validates declastruct plan command produces valid JSON output
       * .why = ensures CLI can parse resources file and produce plan
       * .note = uses beforeAll to run plan command once, shared across assertions
       */
      let plan: { changes: DeclastructChange[] };
      let planStdout: string;

      beforeAll(() => {
        // execute declastruct plan command once for all assertions
        // capture stdout for snapshot verification
        planStdout = execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { env: process.env, encoding: 'utf-8' },
        );

        // parse plan for shared use
        plan = JSON.parse(readFileSync(planFile, 'utf-8'));
      });

      then('it creates a valid plan file', () => {
        // verify plan file exists
        const planExists = existsSync(planFile);
        expect(planExists).toBe(true);

        // verify plan structure
        expect(plan).toHaveProperty('changes');
        expect(Array.isArray(plan.changes)).toBe(true);
      });

      then(
        'plan includes repo, config, environment, team, and membership resources',
        () => {
          /**
           * .what = validates plan includes all declared resources
           * .why = ensures declastruct correctly processes resource declarations
           */

          // verify resources
          const repoResource = plan.changes.find(
            (r: DeclastructChange) =>
              r.forResource.class === 'DeclaredGithubRepo',
          );
          const configResource = plan.changes.find(
            (r: DeclastructChange) =>
              r.forResource.class === 'DeclaredGithubRepoConfig',
          );
          const envResource = plan.changes.find(
            (r: DeclastructChange) =>
              r.forResource.class === 'DeclaredGithubEnvironment',
          );
          const teamResource = plan.changes.find(
            (r: DeclastructChange) =>
              r.forResource.class === 'DeclaredGithubTeam',
          );
          const membershipResource = plan.changes.find(
            (r: DeclastructChange) =>
              r.forResource.class === 'DeclaredGithubTeamMembership',
          );

          expect(repoResource).toBeDefined();
          expect(repoResource!.forResource.slug).toContain(
            'declastruct-github-demo',
          );
          expect(configResource).toBeDefined();
          expect(configResource!.forResource.slug).toContain(
            'declastruct-github-demo',
          );
          expect(envResource).toBeDefined();
          expect(envResource!.forResource.slug).toContain(
            'acceptance-test-env',
          );
          expect(teamResource).toBeDefined();
          expect(teamResource!.forResource.slug).toContain(
            'declastruct-acceptance-test',
          );
          expect(membershipResource).toBeDefined();
        },
      );

      then('plan output matches snapshot', () => {
        /**
         * .what = validates plan structure via snapshot
         * .why = enables visual diff in PRs for contract changes
         */

        // verify plan has expected structure
        expect(plan.changes.length).toBeGreaterThan(0);
        expect(
          plan.changes.every(
            (c: DeclastructChange) => c.forResource?.class !== undefined,
          ),
        ).toBe(true);

        // snapshot plan structure (without volatile fields)
        const planSummary = {
          resourceCount: plan.changes.length,
          resourceClasses: plan.changes.map(
            (c: DeclastructChange) => c.forResource.class,
          ),
        };
        expect(planSummary).toMatchSnapshot();

        // snapshot full plan changes (stable fields only)
        const planChangesNormalized = plan.changes.map(
          (c: DeclastructChange) => ({
            action: c.action,
            forResource: {
              class: c.forResource.class,
              slug: c.forResource.slug,
            },
          }),
        );
        expect(planChangesNormalized).toMatchSnapshot('full plan changes');
      });

      then('CLI stdout includes resource summary', () => {
        /**
         * .what = validates CLI stdout contains expected output
         * .why = ensures CLI output is stable for user consumption
         */

        // verify stdout contains expected content
        expect(planStdout).toContain('plan');

        // snapshot normalized version
        const normalizedStdout = normalizeCliStdoutForSnapshot({
          stdout: planStdout,
        });
        expect(normalizedStdout).toMatchSnapshot('plan CLI stdout');
      });
    });

    when('[t1] plan is applied via declastruct CLI', () => {
      /**
       * .what = validates declastruct apply command works with github provider
       * .why = ensures end-to-end workflow from plan to reality
       * .note = uses beforeAll to create plan once, shared across apply tests
       * .note = requires org:admin scope because resources include teams
       */
      let applyStdout: string;

      beforeAll(() => {
        // fail loud if org admin permission is absent
        const hasOrgAdmin = process.env.TEST_ORG_ADMIN === 'true';
        if (!hasOrgAdmin)
          throw new ConstraintError('TEST_ORG_ADMIN not set', {
            hint: 'set TEST_ORG_ADMIN=true to run apply tests that include team resources',
          });
        // generate plan once for all apply tests
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { env: process.env, encoding: 'utf-8' },
        );

        // apply plan - fail loud on any error
        applyStdout = execSync(`npx declastruct apply --plan ${planFile}`, {
          env: process.env,
          encoding: 'utf-8',
        });
      });

      then('plan file is created', () => {
        // verify plan file exists
        const planExists = existsSync(planFile);
        expect(planExists).toBe(true);
      });

      then('it applies and verifies repo exists', async () => {
        /**
         * .what = verifies repo resource after apply
         * .why = repo operations work without org:admin scope
         */
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const repo = await provider.daos.DeclaredGithubRepo.get.one.byUnique(
          {
            owner: 'ehmpathy',
            name: 'declastruct-github-demo',
          },
          provider.context,
        );
        expect(repo).toBeDefined();
        expect(repo!.name).toBe('declastruct-github-demo');

        // snapshot stable fields of SDK return value
        expect({
          owner: repo!.owner,
          name: repo!.name,
        }).toMatchSnapshot('repo SDK return value after apply');
      });

      then('it applies and verifies environment exists', async () => {
        /**
         * .what = verifies environment resource after apply
         * .why = environment operations work without org:admin scope
         */
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const environment =
          await provider.daos.DeclaredGithubEnvironment.get.one.byUnique(
            {
              repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
              name: 'acceptance-test-env',
            },
            provider.context,
          );
        expect(environment).toBeDefined();
        expect(environment!.name).toBe('acceptance-test-env');

        // snapshot stable fields of SDK return value
        expect({
          repo: environment!.repo,
          name: environment!.name,
        }).toMatchSnapshot('environment SDK return value after apply');
      });

      then('it applies and verifies team exists', async () => {
        /**
         * .what = verifies team resource after apply
         * .why = confirms team creation via declastruct apply
         */
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const team = await provider.daos.DeclaredGithubTeam.get.one.byUnique(
          {
            org: { login: 'ehmpathy' },
            slug: 'declastruct-acceptance-test-team',
          },
          provider.context,
        );
        expect(team).toBeDefined();
        expect(team!.slug).toBe('declastruct-acceptance-test-team');

        // snapshot stable fields of SDK return value
        expect({
          org: team!.org,
          slug: team!.slug,
          name: team!.name,
          privacy: team!.privacy,
          notifications: team!.notifications,
          parent: team!.parent,
        }).toMatchSnapshot('team SDK return value after apply');
      });

      then('it applies and verifies team membership exists', async () => {
        /**
         * .what = verifies team membership resource after apply
         * .why = confirms membership creation via declastruct apply
         */
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const membership =
          await provider.daos.DeclaredGithubTeamMembership.get.one.byUnique(
            {
              team: {
                org: { login: 'ehmpathy' },
                slug: 'declastruct-acceptance-test-team',
              },
              username: 'uladkasach',
            },
            provider.context,
          );
        expect(membership).toBeDefined();
        expect(membership!.role).toBe('maintainer');

        // snapshot stable fields of SDK return value
        expect({
          team: membership!.team,
          username: membership!.username,
          role: membership!.role,
        }).toMatchSnapshot('membership SDK return value after apply');
      });

      then('it applies and verifies repo config exists', async () => {
        /**
         * .what = verifies repo config resource after apply
         * .why = confirms repo config via declastruct apply
         */
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const config =
          await provider.daos.DeclaredGithubRepoConfig.get.one.byUnique(
            {
              repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
            },
            provider.context,
          );
        expect(config).toBeDefined();

        // snapshot stable fields of SDK return value
        expect({
          repo: config!.repo,
          allowMergeCommit: config!.allowMergeCommit,
          allowSquashMerge: config!.allowSquashMerge,
          allowRebaseMerge: config!.allowRebaseMerge,
        }).toMatchSnapshot('config SDK return value after apply');
      });

      then('apply CLI stdout matches snapshot', () => {
        /**
         * .what = snapshot apply stdout for visual diff
         * .why = enables regression detection in apply output
         */

        // verify apply stdout is captured
        expect(applyStdout).toBeDefined();
        expect(applyStdout.length).toBeGreaterThan(0);

        const normalizedApplyStdout = normalizeCliStdoutForSnapshot({
          stdout: applyStdout,
        });
        expect(normalizedApplyStdout).toMatchSnapshot('apply CLI stdout');
      });

      then(
        'it is idempotent - replan after apply shows environment as KEEP',
        () => {
          /**
           * .what = validates environment is idempotent after apply
           * .why = ensures declastruct environment operations follow idempotency requirements
           * .note = creates a fresh plan after apply; environment should show KEEP action
           */

          // create a fresh plan after first apply
          const replanFile = join(testDir, 'replan.json');
          const replanStdout = execSync(
            `npx declastruct plan --wish ${resourcesFile} --into ${replanFile}`,
            {
              env: process.env,
              encoding: 'utf-8',
            },
          );

          // snapshot the replan CLI output
          const normalizedReplanStdout = normalizeCliStdoutForSnapshot({
            stdout: replanStdout,
          });
          expect(normalizedReplanStdout).toMatchSnapshot('replan CLI stdout');

          // verify environment resource shows KEEP (idempotent)
          const replan = JSON.parse(readFileSync(replanFile, 'utf8'));
          const envChange = replan.changes.find(
            (c: DeclastructChange) =>
              c.forResource.class === 'DeclaredGithubEnvironment',
          );
          expect(envChange).toBeDefined();
          expect(envChange!.action).toBe('KEEP');

          // snapshot the environment change (stable fields only)
          expect({
            action: envChange!.action,
            forResource: {
              class: envChange!.forResource.class,
              slug: envChange!.forResource.slug,
            },
          }).toMatchSnapshot('replan environment change KEEP');
        },
      );

      then('it is idempotent - replan after apply shows team as KEEP', () => {
        /**
         * .what = validates all team resources are idempotent after apply
         * .why = ensures declastruct team operations follow idempotency requirements
         */
        const replanFile = join(testDir, 'replan.json');
        const replan = JSON.parse(readFileSync(replanFile, 'utf8'));
        const teamChanges = replan.changes.filter(
          (c: DeclastructChange) =>
            c.forResource.class === 'DeclaredGithubTeam',
        );
        expect(teamChanges.length).toBeGreaterThan(0);
        for (const teamChange of teamChanges) {
          expect(teamChange.action).toBe('KEEP');
        }

        // snapshot the team changes (stable fields only)
        const teamChangesNormalized = teamChanges.map(
          (c: DeclastructChange) => ({
            action: c.action,
            forResource: {
              class: c.forResource.class,
              slug: c.forResource.slug,
            },
          }),
        );
        expect(teamChangesNormalized).toMatchSnapshot(
          'replan team changes KEEP',
        );
      });

      then(
        'it is idempotent - replan after apply shows membership as KEEP',
        () => {
          /**
           * .what = validates all team membership resources are idempotent after apply
           * .why = ensures declastruct membership operations follow idempotency requirements
           */
          const replanFile = join(testDir, 'replan.json');
          const replan = JSON.parse(readFileSync(replanFile, 'utf8'));
          const membershipChanges = replan.changes.filter(
            (c: DeclastructChange) =>
              c.forResource.class === 'DeclaredGithubTeamMembership',
          );
          expect(membershipChanges.length).toBeGreaterThan(0);
          for (const membershipChange of membershipChanges) {
            expect(membershipChange.action).toBe('KEEP');
          }

          // snapshot the membership changes (stable fields only)
          const membershipChangesNormalized = membershipChanges.map(
            (c: DeclastructChange) => ({
              action: c.action,
              forResource: {
                class: c.forResource.class,
                slug: c.forResource.slug,
              },
            }),
          );
          expect(membershipChangesNormalized).toMatchSnapshot(
            'replan membership changes KEEP',
          );
        },
      );
    });

    when('[t2] CLI help output is requested', () => {
      /**
       * .what = validates CLI help output for plan and apply commands
       * .why = ensures help output is stable and documented via snapshots
       */

      then('plan --help shows usage information', () => {
        const helpStdout = execSync('npx declastruct plan --help', {
          env: process.env,
          encoding: 'utf-8',
        });

        expect(helpStdout).toContain('plan');
        expect(helpStdout).toMatchSnapshot('plan --help output');
      });

      then('apply --help shows usage information', () => {
        const helpStdout = execSync('npx declastruct apply --help', {
          env: process.env,
          encoding: 'utf-8',
        });

        expect(helpStdout).toContain('apply');
        expect(helpStdout).toMatchSnapshot('apply --help output');
      });
    });

    when('[t3] CLI is called with invalid input', () => {
      /**
       * .what = validates CLI error output for invalid inputs
       * .why = ensures error messages are stable and helpful
       *
       * coverage matrix:
       * | scenario                    | command | tested |
       * |-----------------------------|---------|--------|
       * | nonexistent wish file       | plan    | yes    |
       * | nonexistent plan file       | apply   | yes    |
       * | invalid wish file syntax    | plan    | yes    |
       * | empty plan file             | apply   | yes    |
       * | invalid plan file syntax    | apply   | yes    |
       */

      then('plan with nonexistent wish file shows clear error', () => {
        let errorOutput = '';
        try {
          execSync(
            'npx declastruct plan --wish /nonexistent/path.ts --into /tmp/plan.json',
            {
              env: process.env,
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe'],
            },
          );
        } catch (err) {
          const execError = err as {
            stderr?: string;
            stdout?: string;
            message?: string;
          };
          errorOutput =
            execError.stderr || execError.stdout || execError.message || '';
        }

        expect(errorOutput.length).toBeGreaterThan(0);

        const stable = normalizeErrorOutputForSnapshot({ errorOutput });
        expect(stable).toMatchSnapshot('plan nonexistent wish error');
      });

      then('apply with nonexistent plan file shows clear error', () => {
        let errorOutput = '';
        try {
          execSync('npx declastruct apply --plan /nonexistent/plan.json', {
            env: process.env,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } catch (err) {
          const execError = err as {
            stderr?: string;
            stdout?: string;
            message?: string;
          };
          errorOutput =
            execError.stderr || execError.stdout || execError.message || '';
        }

        expect(errorOutput.length).toBeGreaterThan(0);

        const stable = normalizeErrorOutputForSnapshot({ errorOutput });
        expect(stable).toMatchSnapshot('apply nonexistent plan error');
      });

      then('plan with invalid wish file syntax shows clear error', () => {
        // create a temporary file with invalid TypeScript
        const invalidWishFile = join(testDir, 'invalid-wish.ts');
        const { writeFileSync } = require('fs');
        writeFileSync(invalidWishFile, 'this is not valid typescript {{{');

        let errorOutput = '';
        try {
          execSync(
            `npx declastruct plan --wish ${invalidWishFile} --into /tmp/plan.json`,
            {
              env: process.env,
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe'],
            },
          );
        } catch (err) {
          const execError = err as {
            stderr?: string;
            stdout?: string;
            message?: string;
          };
          errorOutput =
            execError.stderr || execError.stdout || execError.message || '';
        }

        expect(errorOutput.length).toBeGreaterThan(0);

        const stableErrorOutput = normalizeErrorOutputForSnapshot({
          errorOutput,
        });
        expect(stableErrorOutput).toMatchSnapshot('plan invalid syntax error');
      });

      then('apply with empty plan file shows clear error', () => {
        // create empty plan file
        const emptyPlanFile = join(testDir, 'empty-plan.json');
        const { writeFileSync } = require('fs');
        writeFileSync(emptyPlanFile, '');

        let errorOutput = '';
        try {
          execSync(`npx declastruct apply --plan ${emptyPlanFile}`, {
            env: process.env,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } catch (err) {
          const execError = err as {
            stderr?: string;
            stdout?: string;
            message?: string;
          };
          errorOutput =
            execError.stderr || execError.stdout || execError.message || '';
        }

        expect(errorOutput.length).toBeGreaterThan(0);

        const stable = normalizeErrorOutputForSnapshot({ errorOutput });
        expect(stable).toMatchSnapshot('apply empty plan error');
      });

      then('apply with invalid plan file syntax shows clear error', () => {
        // create a plan file with invalid JSON
        const invalidPlanFile = join(testDir, 'invalid-plan.json');
        const { writeFileSync } = require('fs');
        writeFileSync(invalidPlanFile, 'this is not valid json {{{');

        let errorOutput = '';
        try {
          execSync(`npx declastruct apply --plan ${invalidPlanFile}`, {
            env: process.env,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } catch (err) {
          const execError = err as {
            stderr?: string;
            stdout?: string;
            message?: string;
          };
          errorOutput =
            execError.stderr || execError.stdout || execError.message || '';
        }

        expect(errorOutput.length).toBeGreaterThan(0);

        const stable = normalizeErrorOutputForSnapshot({ errorOutput });
        expect(stable).toMatchSnapshot('apply invalid syntax error');
      });
    });

    when('[t4] SDK boundary tests (not-found paths)', () => {
      /**
       * .what = validates SDK methods return null for nonexistent resources
       * .why = negative path snapshot coverage for exhaustive contract testing
       * .note = does not require org admin since these are read-only operations
       */

      then('SDK get returns null for nonexistent repo', async () => {
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const repo = await provider.daos.DeclaredGithubRepo.get.one.byUnique(
          {
            owner: 'ehmpathy',
            name: 'this-repo-does-not-exist-12345',
          },
          provider.context,
        );
        expect(repo).toBeNull();
        expect(repo).toMatchSnapshot('repo SDK not-found returns null');
      });

      then('SDK get returns null for nonexistent environment', async () => {
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const environment =
          await provider.daos.DeclaredGithubEnvironment.get.one.byUnique(
            {
              repo: { owner: 'ehmpathy', name: 'declastruct-github-demo' },
              name: 'this-env-does-not-exist-12345',
            },
            provider.context,
          );
        expect(environment).toBeNull();
        expect(environment).toMatchSnapshot(
          'environment SDK not-found returns null',
        );
      });

      then('SDK get returns null for nonexistent repo config', async () => {
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const config =
          await provider.daos.DeclaredGithubRepoConfig.get.one.byUnique(
            {
              repo: {
                owner: 'ehmpathy',
                name: 'this-repo-does-not-exist-12345',
              },
            },
            provider.context,
          );
        expect(config).toBeNull();
        expect(config).toMatchSnapshot('config SDK not-found returns null');
      });

      then('SDK get returns null for nonexistent team', async () => {
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const team = await provider.daos.DeclaredGithubTeam.get.one.byUnique(
          {
            org: { login: 'ehmpathy' },
            slug: 'this-team-does-not-exist-12345',
          },
          provider.context,
        );
        expect(team).toBeNull();
        expect(team).toMatchSnapshot('team SDK not-found returns null');
      });

      then('SDK get returns null for nonexistent team membership', async () => {
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        const membership =
          await provider.daos.DeclaredGithubTeamMembership.get.one.byUnique(
            {
              team: {
                org: { login: 'ehmpathy' },
                slug: 'this-team-does-not-exist-12345',
              },
              username: 'nonexistent-user-12345',
            },
            provider.context,
          );
        expect(membership).toBeNull();
        expect(membership).toMatchSnapshot(
          'membership SDK not-found returns null',
        );
      });
    });
  });
});
