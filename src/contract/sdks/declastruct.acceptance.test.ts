import { execSync } from 'child_process';
import type { DeclastructChange } from 'declastruct';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getSampleGithubContext } from '@src/.test/assets/getSampleGithubContext';
import { getDeclastructGithubProvider } from '@src/domain.operations/provider/getDeclastructGithubProvider';

const log = console;

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

      then('plan includes repo, config, and environment resources', () => {
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

        expect(repoResource).toBeDefined();
        expect(repoResource!.forResource.slug).toContain(
          'declastruct-github-demo',
        );
        expect(configResource).toBeDefined();
        expect(configResource!.forResource.slug).toContain(
          'declastruct-github-demo',
        );
        expect(envResource).toBeDefined();
        expect(envResource!.forResource.slug).toContain('acceptance-test-env');
      });

      then('plan output matches snapshot', () => {
        /**
         * .what = validates plan structure via snapshot
         * .why = enables visual diff in PRs for contract changes
         */

        // snapshot plan structure (without volatile fields)
        const planSummary = {
          resourceCount: plan.changes.length,
          resourceClasses: plan.changes.map(
            (c: DeclastructChange) => c.forResource.class,
          ),
        };
        expect(planSummary).toMatchSnapshot();
      });

      then('CLI stdout includes resource summary', () => {
        /**
         * .what = validates CLI stdout contains expected output
         * .why = ensures CLI output is stable for user consumption
         */

        // verify stdout contains expected content
        expect(planStdout).toContain('plan');
        // snapshot a normalized version (remove timestamps, paths, durations, spinner animation)
        const normalizedStdout = planStdout
          .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<timestamp>')
          .replace(/\/[^\s]+\.json/g, '<path>.json')
          .replace(/\/[^\s]+\.ts/g, '<path>.ts')
          .replace(/done in \d+\.\d+s/g, 'done in <time>s')
          // strip ESC characters (terminal control sequences)
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          // strip cursor control sequences (may be mid-line like [A[K)
          .replace(/\[A/g, '')
          // strip all spinner animation lines, keep completion lines
          .split('\n')
          .filter((line) => {
            // remove inflight spinner lines
            if (line.includes('inflight')) return false;
            // remove cursor clear lines that don't have completion status
            if (line.includes('[K') && !line.includes('done in')) return false;
            return true;
          })
          // clean up [K prefix from completion lines and strip trailing whitespace
          .map((line) => line.replace(/^\[K/, '').trimEnd())
          .join('\n');
        expect(normalizedStdout).toMatchSnapshot('plan CLI stdout');
      });
    });

    when('[t1] plan is applied via declastruct CLI', () => {
      /**
       * .what = validates declastruct apply command works with github provider
       * .why = ensures end-to-end workflow from plan to reality
       * .note = uses beforeAll to create plan once, shared across apply tests
       */
      let applyStdout: string;

      beforeAll(() => {
        // generate plan once for all apply tests
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { env: process.env, encoding: 'utf-8' },
        );
      });

      then('plan file is created', () => {
        // verify plan file exists
        const planExists = existsSync(planFile);
        expect(planExists).toBe(true);
      });

      then('it applies changes and verifies resources exist', async () => {
        /**
         * .note = uses declastruct-github-demo repo for idempotent test
         */

        // apply plan and capture stdout
        applyStdout = execSync(`npx declastruct apply --plan ${planFile}`, {
          env: process.env,
          encoding: 'utf-8',
        });

        // verify resources exist via github API
        const provider = getDeclastructGithubProvider(
          {
            credentials: { token: githubContext.github.token },
          },
          { log },
        );

        // verify repo
        const repo = await provider.daos.DeclaredGithubRepo.get.one.byUnique(
          {
            owner: 'ehmpathy',
            name: 'declastruct-github-demo',
          },
          provider.context,
        );
        expect(repo).toBeDefined();
        expect(repo!.name).toBe('declastruct-github-demo');

        // verify environment
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

        // snapshot apply stdout (normalized)
        const normalizedApplyStdout = applyStdout
          .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<timestamp>')
          .replace(/\/[^\s]+\.json/g, '<path>.json')
          .replace(/\d+ms/g, '<duration>ms')
          .replace(/done in \d+\.\d+s/g, 'done in <time>s')
          // strip ESC characters (terminal control sequences)
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          // strip cursor control sequences (may be mid-line like [A[K)
          .replace(/\[A/g, '')
          // strip all spinner animation lines, keep completion lines
          .split('\n')
          .filter((line) => {
            // remove inflight spinner lines
            if (line.includes('inflight')) return false;
            // remove cursor clear lines that don't have completion status
            if (line.includes('[K') && !line.includes('done in')) return false;
            return true;
          })
          // clean up [K prefix from completion lines and strip end whitespace
          .map((line) => line.replace(/^\[K/, '').trimEnd())
          .join('\n');
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
          execSync(
            `npx declastruct plan --wish ${resourcesFile} --into ${replanFile}`,
            {
              stdio: 'inherit',
              env: process.env,
            },
          );

          // verify environment resource shows KEEP (idempotent)
          const replan = JSON.parse(readFileSync(replanFile, 'utf8'));
          const envChange = replan.changes.find(
            (c: DeclastructChange) =>
              c.forResource.class === 'DeclaredGithubEnvironment',
          );
          expect(envChange).toBeDefined();
          expect(envChange!.action).toBe('KEEP');
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
        // strip ESC chars and end whitespace from each line
        const stable = errorOutput
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n');
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
        // strip ESC chars and end whitespace from each line
        const stable = errorOutput
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n');
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
        // strip ESC chars, timestamps, and end whitespace from each line
        const stableErrorOutput = errorOutput
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          .replace(
            /run\.\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            'run.<timestamp>',
          )
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n');
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
        // strip ESC chars and end whitespace from each line
        const stable = errorOutput
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ESC stripping for terminal output
          .replace(/\x1b/g, '')
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n');
        expect(stable).toMatchSnapshot('apply empty plan error');
      });
    });
  });
});
